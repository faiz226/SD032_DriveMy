// DriveMy v2's simulator. One world, loaded once. Assessment is the full circuit, marked and saved; practice is
// one station at a time, restarted at will and never saved. Picking or restarting a station moves the car;
// nothing reloads. The verdict comes from the rules session alone: no button can pass a run.
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowsClockwise } from 'phosphor-react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OFFLINE_QUEUED_ID, saveSimulationResult } from '@/services/results.service';
import { useAuthStore } from '@/stores/authStore';
import type { Mode, SimEvent, StationId, VehicleSample } from '../contracts';
import { circuit, rules, swift } from '../data';
import { rad } from '../geom';
import { useDriver, useHead, useKeyboardControls, useTouchPref, useTouchUi } from '../input';
import { OtherCars } from '../physics/OtherCars';
import { Traffic } from '../traffic/model';
import { TrafficView } from '../traffic/TrafficView';
import { type CarApi, SwiftCar } from '../physics/SwiftCar';
import type { MirrorId } from '../physics/mirrors';
import { TIERS, type TierPref, useQualityPref, useTier } from '../quality';
import { runRecord } from '../record';
import { TouchControls } from '../TouchControls';
import { Daylight, TopDownCamera, World } from '../world/World';
import { Hud, HUD_PLATE } from './Hud';
import { ModePanel } from './ModePanel';
import { type Pose, spawnPose, useRun } from './run';
import { Autopilot, PERF_TOOLS } from './autopilot';
import { CameraKick, dprFor, FrameProbe, HeadDrag, RenderScale, WhereNext } from './scene';
import { engineSound, pauseSound, say, startEngine, stopEngine, unlockSound, useVoicePref } from './sound';
import { LoadingMap } from './LoadingMap';
import { EXPLORE_CANVAS, ExploreHud, SpectatorCamera } from './Spectator';
import { type SaveStatus, VerdictView } from './Verdict';

type Phase = 'choose' | 'explore' | 'drive' | 'verdict';
const STATIONS = new Set<string>(circuit.stations.map((s) => s.id));
const isStation = (id: string | undefined): id is StationId => !!id && STATIONS.has(id);

const stationStart = (id: StationId): Pose => {
  const st = circuit.stations.find((s) => s.id === id)!;
  return { at: st.start.at, heading: rad(st.start.heading_deg) };
};

const zoomNow = () => useDriver.getState().zoom;
const zoomBy = (f: number) => useDriver.getState().zoomBy(f);

const portraitNow = () => window.innerHeight > window.innerWidth;
const onResize = (cb: () => void) => { window.addEventListener('resize', cb); return () => window.removeEventListener('resize', cb); };

/** A duplicate key means the row is already there: this run was saved. */
const isDuplicate = (err: unknown) => (err as { code?: string } | null)?.code === '23505';

export function SimulatorPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const autopilotMode = PERF_TOOLS ? params.get('autopilot') : null;
  const autopilotOn = autopilotMode === '1' || autopilotMode === 'faults';
  const probe = PERF_TOOLS && params.get('perf') === '1';
  const mirrorsOn = !(PERF_TOOLS && params.get('mirrors') === '0');   // performance runs can switch them off
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const touch = useTouchUi();
  const touchPref = useTouchPref((s) => s.pref);
  const voicePref = useVoicePref((s) => s.pref);
  const qualityPref = useQualityPref((s) => s.pref);
  const auto_ = useTier();
  const forced = PERF_TOOLS ? params.get('quality') : null;   // performance runs can force a tier
  const tier = forced === 'low' || forced === 'medium' ? forced : auto_.tier;
  const detected = auto_.detected;
  const doors = PERF_TOOLS && params.get('interior') === '0';   // performance runs: the cut list's door-mirrors-only
  const spec = useMemo(() => (doors ? { ...TIERS[tier], mirrors: { ...TIERS[tier].mirrors, ids: ['left', 'right'] as MirrorId[] } } : TIERS[tier]), [doors, tier]);
  const portrait = useSyncExternalStore(onResize, portraitNow, () => false);
  const topDown = useDriver((s) => s.topDown);
  const paused = useDriver((s) => s.paused);
  const verdict = useRun((s) => s.state.verdict);

  const car = useRef<CarApi>(null);
  const carGroup = useCallback(() => car.current?.group() ?? null, []);
  const [phase, setPhase] = useState<Phase>('choose');
  const phaseRef = useRef<Phase>('choose');
  const [mode, setMode] = useState<Mode>(isStation(id) ? 'practice' : 'assessment');
  const [drill, setDrill] = useState<StationId>(isStation(id) ? id : 'hill-start');
  const [start] = useState<Pose>(() => (isStation(id) ? stationStart(id) : spawnPose()));
  const [ready, setReady] = useState(false);
  const [loads, setLoads] = useState(0);
  const [save, setSave] = useState<SaveStatus | null>(null);
  const savedRun = useRef<string | null>(null);
  const auto = useRef<Autopilot | null>(null);
  const drove = useRef(false);
  // the other cars: a fresh yard of them each run, stepped with the physics in onStep
  const [firstTraffic] = useState(() => new Traffic(circuit, swift));
  const traffic = useRef(firstTraffic);
  const getTraffic = useCallback(() => traffic.current, []);

  // the autopilot never loses focus to a person, so it never pauses for it
  useKeyboardControls(phase === 'drive' && !autopilotOn);
  // scripts/sim-demo.mjs times its screenshots from these (development and performance builds only)
  useEffect(() => { if (PERF_TOOLS) Object.assign(window, { __simRun: useRun, __simDriver: useDriver, __simHead: useHead }); }, []);
  useEffect(() => () => {
    useDriver.getState().set({ throttle: 0, brake: 0, wheel: 0, paused: false, topDown: false });
    stopEngine();
  }, []);
  useEffect(() => { if (portrait) useDriver.getState().set({ paused: true }); }, [portrait]);
  useEffect(() => pauseSound(paused), [paused]);
  // the instructor: each station's brief as it arms, its outcome, and the verdict
  useEffect(() => useRun.subscribe((now, before) => {
    if (phaseRef.current !== 'drive') return;
    for (const st of now.state.stations) {
      if (st.status === before.state.stations.find((s) => s.id === st.id)?.status) continue;
      if (st.status === 'armed') say(`sim.tips.${st.id}`, language);
      else if (st.status === 'cleared') say('sim.voice.cleared', language);
      else if (st.status === 'failed') say('sim.voice.notCleared', language);
    }
    if (now.state.verdict && !before.state.verdict) say(now.state.verdict.pass ? 'sim.voice.pass' : 'sim.voice.fail', language);
  }), [language]);

  const go = useCallback((next: Phase) => { phaseRef.current = next; setPhase(next); }, []);
  const toChoose = useCallback(() => go('choose'), [go]);

  const begin = useCallback((m: Mode, d: StationId) => {
    unlockSound();
    startEngine();
    performance.mark('sim:start');
    traffic.current = new Traffic(circuit, swift);
    auto.current = autopilotOn ? new Autopilot(autopilotMode === 'faults', getTraffic) : null;
    const pose = useRun.getState().begin(m, d);
    car.current?.teleport(pose.at, pose.heading);
    useDriver.getState().set({ throttle: 0, brake: 0, wheel: 0, gear: 'D', handbrake: m === 'assessment' && circuit.spawn.handbrake, paused: false });
    setMode(m);
    setDrill(d);
    setSave(null);
    go('drive');
  }, [go, autopilotOn, autopilotMode, getTraffic]);

  /** An assessment's verdict is in: show it and save the run once, under the run's own id. */
  const finish = useCallback(() => {
    const run = useRun.getState();
    go('verdict');
    useDriver.getState().set({ throttle: 0, brake: 1, wheel: 0 });
    if (auto.current) {
      // a run the autopilot drove is never saved; it goes round again for the performance run
      savedRun.current = run.runId;
      window.setTimeout(() => begin('assessment', 'hill-start'), 3000);
      return;
    }
    if (!user || savedRun.current === run.runId) return;
    savedRun.current = run.runId;
    setSave('saving');
    const record = runRecord({ id: run.runId, userId: user.id, language, state: run.state, seconds: run.elapsed, rulesLabel: rules.label, car: swift.name });
    saveSimulationResult(record)
      .then((row) => {
        setSave((row as { id?: string } | null)?.id === OFFLINE_QUEUED_ID ? 'offline' : 'saved');
        for (const key of [['recentActivity'], ['simsDone', user.id], ['progress', 'sim', user.id], ['progress', 'readiness', user.id]]) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      })
      .catch((err: unknown) => setSave(isDuplicate(err) ? 'saved' : 'failed'));
  }, [go, begin, user, language, queryClient]);

  // every physics step: the rules see it; an assessment ends when its verdict appears
  const onStep = useCallback((sample: VehicleSample, events: SimEvent[], dt: number) => {
    if (phaseRef.current !== 'drive') return;
    if (!drove.current) { drove.current = true; performance.mark('sim:drive'); }
    const run = useRun.getState();
    const driver = useDriver.getState();
    run.step(sample, [...events, ...traffic.current.step(dt, sample)], dt, driver.topDown);
    engineSound(sample.speedKmh, driver.throttle);
    if (auto.current) useDriver.getState().set(auto.current.next(sample, dt));
    const now = useRun.getState();
    if (now.mode === 'assessment' && now.state.verdict && savedRun.current !== now.runId) finish();
  }, [finish]);

  const exit = () => navigate(ROUTES.SIMULATIONS);

  const ready_ = () => {
    performance.mark('sim:ready');
    window.dispatchEvent(new Event('sim:ready'));   // main.tsx: the service worker may now precache
    setReady(true);
    if (autopilotOn && phaseRef.current === 'choose') window.setTimeout(() => begin('assessment', 'hill-start'), 0);
  };

  /** A new quality applies before the next run: the scene rebuilds at that tier, so wait for it again. */
  const changeQuality = (p: TierPref) => {
    if (TIERS[p === 'auto' ? detected : p] !== spec) {
      setReady(false);
      setLoads((n) => n + 1);   // a fresh loading map for the rebuild
    }
    useQualityPref.getState().setPref(p);
  };

  return (
    <div className={cn('fixed inset-0 z-[70] overflow-hidden bg-[rgb(var(--asphalt))]', phase === 'explore' && EXPLORE_CANVAS, phase === 'drive' && '[&_canvas]:touch-none')}>
      <Canvas key={tier} dpr={dprFor(spec, 1)} shadows={spec.shadows} gl={{ powerPreference: 'high-performance' }}>
        <RenderScale spec={spec} />
        {probe && <FrameProbe />}
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60} paused={paused || phase !== 'drive'}>
            <World tier={tier} />
            <SwiftCar ref={car} quality={spec} start={start} firstPerson={!topDown} mirrors={mirrorsOn && phase !== 'explore'} onStep={onStep} onReady={ready_} />
            <OtherCars tier={tier} />
            <TrafficView tier={tier} traffic={getTraffic} />
          </Physics>
          <Daylight shadows={spec.shadows} follow={carGroup} />
          <WhereNext />
        </Suspense>
        <TopDownCamera active={topDown} zoom={zoomNow} onZoom={zoomBy} follow={carGroup} />
        {phase === 'explore' && <SpectatorCamera from={carGroup} />}
        <HeadDrag enabled={phase === 'drive' && !topDown} />
        <CameraKick />
      </Canvas>

      <LoadingMap key={loads} ready={ready} />
      {phase === 'choose' && (
        <ModePanel
          mode={mode}
          drill={drill}
          ready={ready}
          onMode={setMode}
          onDrill={setDrill}
          settings={{
            quality: qualityPref, detected, touch: touchPref, voice: voicePref,
            onQuality: changeQuality, onTouch: (p) => useTouchPref.getState().setPref(p), onVoice: (p) => useVoicePref.getState().setPref(p),
          }}
          onStart={() => begin(mode, drill)}
          onExplore={() => go('explore')}
          onExit={exit}
        />
      )}
      {phase === 'explore' && <ExploreHud touch={touch} onBack={toChoose} />}
      {phase === 'drive' && (
        <>
          <Hud touch={touch} onRestart={() => begin(mode, drill)} onStations={() => { setMode('practice'); go('choose'); }} onExit={exit} />
          {touch && <TouchControls />}
        </>
      )}
      {phase === 'verdict' && verdict && (
        <VerdictView
          verdict={verdict}
          save={save}
          onRetry={() => begin('assessment', drill)}
          onPractise={(st) => begin('practice', st)}
          onExit={exit}
        />
      )}
      {portrait && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--asphalt)/0.92)] p-6" role="alert">
          <div className={`${HUD_PLATE} flex max-w-xs flex-col items-center gap-3 p-5 text-center`}>
            <ArrowsClockwise size={40} />
            <p className="type-label-strong">{t('sim.rotate')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
