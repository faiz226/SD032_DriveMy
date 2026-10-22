// DriveMy v2's simulator. One world, loaded once. Assessment is the full circuit, marked and saved; practice is
// one station at a time, restarted at will and never saved; free drive (the owner, 20 Oct) is the yard for fun,
// among the traffic, which the rules never see: nothing marked, nothing saved. Picking or restarting a station
// moves the car; nothing reloads. The verdict comes from the rules session alone: no button can pass a run.
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowsClockwise } from '@/components/ui/icons';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OFFLINE_QUEUED_ID, saveSimulationResult } from '@/services/results.service';
import { useAuthStore } from '@/stores/authStore';
import type { SimEvent, StationId, VehicleSample } from '../contracts';
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
import { Scenery } from '../world/Scenery';
import { Hud, HUD_PLATE } from './Hud';
import { ModePanel, type PanelMode } from './ModePanel';
import { type Pose, spawnPose, useRun } from './run';
import { Autopilot, PERF_TOOLS } from './autopilot';
import { CameraKick, ChaseCamera, dprFor, FrameProbe, HeadDrag, RenderScale, WhereNext } from './scene';
import { engineSound, farHornSound, hornSound, pauseSound, say, startEngine, stopEngine, unlockSound, useVoicePref } from './sound';
import { briefFor } from './start';
import { Eggs, RoofNote, useEggs, useKonami, ZebraCat } from './Eggs';
import { LoadingMap } from './LoadingMap';
import { EXPLORE_CANVAS, ExploreHud, SpectatorCamera } from './Spectator';
import { type SaveStatus, VerdictView } from './Verdict';

type Phase = 'choose' | 'explore' | 'drive' | 'verdict';
const STATIONS = new Set<string>(circuit.stations.map((s) => s.id));
const isStation = (id: string | undefined): id is StationId => !!id && STATIONS.has(id);
/** /simulations/free opens free drive; a station's id, its practice; anything else, the assessment. */
const modeFor = (id: string | undefined): PanelMode => (id === 'free' ? 'free' : isStation(id) ? 'practice' : 'assessment');

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
  const sceneryOn = !(PERF_TOOLS && params.get('scenery') === '0');   // and the land round the yard
  const trafficOn = !(PERF_TOOLS && params.get('traffic') === '0');   // and the moving cars' drawing (they still drive)
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
  const chase = useDriver((s) => s.chase);
  const verdict = useRun((s) => s.state.verdict);

  const car = useRef<CarApi>(null);
  const carGroup = useCallback(() => car.current?.group() ?? null, []);
  const [phase, setPhase] = useState<Phase>('choose');
  const phaseRef = useRef<Phase>('choose');
  const [mode, setMode] = useState<PanelMode>(() => modeFor(id));
  const free = useRef(false);   // the run under way is free drive: the rules never see it
  const eggs = useRef<Eggs | null>(null);   // free drive's surprises
  const getEggs = useCallback(() => eggs.current, []);
  const lastSample = useRef<VehicleSample | null>(null);
  const spoken = useRef(new Set<string>());   // the briefs read this visit: each once, never again on a respawn
  const starts = useRef(0);                   // the latest start: an older one stops where it is
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
  useEffect(() => { if (PERF_TOOLS) Object.assign(window, { __simRun: useRun, __simDriver: useDriver, __simHead: useHead, __simCar: () => car.current, __simEggs: getEggs }); }, [getEggs]);
  useEffect(() => () => {
    useDriver.getState().set({ throttle: 0, brake: 0, wheel: 0, paused: false, topDown: false, indicator: 0, starting: null });
    stopEngine();
  }, []);
  useEffect(() => { if (portrait) useDriver.getState().set({ paused: true }); }, [portrait]);
  useEffect(() => pauseSound(paused), [paused]);
  useKonami(mode === 'free' && phase === 'drive');
  // the horn, in every mode; in free drive the cars ahead flash their hazards back and honk back
  useEffect(() => useDriver.subscribe((now, before) => {
    if (now.horn === before.horn || phaseRef.current !== 'drive') return;
    hornSound();
    const at = lastSample.current;
    if (free.current && at && traffic.current.honk(at) > 0) {
      farHornSound();
      useEggs.getState().say('sim.egg.wave');
    }
  }), []);
  // the instructor: each station's brief as it arms, its outcome, and the verdict
  useEffect(() => useRun.subscribe((now, before) => {
    if (phaseRef.current !== 'drive') return;
    for (const st of now.state.stations) {
      if (st.status === before.state.stations.find((s) => s.id === st.id)?.status) continue;
      const brief = `sim.tips.${st.id}`;
      if (st.status === 'armed') { if (!spoken.current.has(brief)) { spoken.current.add(brief); void say(brief, language); } }
      else if (st.status === 'cleared') say('sim.voice.cleared', language);
      else if (st.status === 'failed') say('sim.voice.notCleared', language);
    }
    if (now.state.verdict && !before.state.verdict) say(now.state.verdict.pass ? 'sim.voice.pass' : 'sim.voice.fail', language);
  }), [language]);

  const go = useCallback((next: Phase) => { phaseRef.current = next; setPhase(next); }, []);
  const toChoose = useCallback(() => go('choose'), [go]);

  const begin = useCallback((m: PanelMode, d: StationId) => {
    unlockSound();
    performance.mark('sim:start');
    traffic.current = new Traffic(circuit, swift);
    free.current = m === 'free';
    eggs.current = m === 'free' ? new Eggs() : null;
    auto.current = autopilotOn && m !== 'free' ? new Autopilot(autopilotMode === 'faults', getTraffic) : null;
    const pose = m === 'free' ? spawnPose() : useRun.getState().begin(m, d);
    car.current?.teleport(pose.at, pose.heading);
    useDriver.getState().set({
      throttle: 0, brake: 0, wheel: 0, gear: 'D', handbrake: m === 'assessment' && circuit.spawn.handbrake, paused: false, indicator: 0,
      ...(m !== 'free' && { rainbow: false }),   // the marked modes drive the plain red Swift
    });
    // the start (the owner, 21 Oct): the brief, read once a visit; then the engine, started afresh every time;
    // only then is the car free to move. A newer start (a restart mid-way) takes over from this one.
    const run = ++starts.current;
    const brief = briefFor(m, d, spoken.current);
    useDriver.getState().set({ starting: brief ? 'brief' : 'engine' });
    const within = (p: Promise<void>, s: number) => Promise.race([p, new Promise<void>((done) => { window.setTimeout(done, s * 1000); })]);
    void (async () => {
      if (brief) {
        spoken.current.add(brief);
        await say(brief, language);   // held while the game is paused, as the line is
        if (run !== starts.current) return;
        useDriver.getState().set({ starting: 'engine' });
      }
      await within(startEngine(), 6);
      if (run === starts.current) useDriver.getState().set({ starting: null });
    })();
    setMode(m);
    setDrill(d);
    setSave(null);
    go('drive');
  }, [go, autopilotOn, autopilotMode, getTraffic, language]);

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
    const driver = useDriver.getState();
    const met = traffic.current.step(dt, sample);
    engineSound(sample.speedKmh, driver.throttle);
    lastSample.current = sample;
    if (free.current) {   // free drive: nothing is marked; the surprises watch instead
      eggs.current?.step(sample, dt);
      return;
    }
    const run = useRun.getState();
    run.step(sample, [...events, ...met], dt, driver.topDown);
    if (auto.current) useDriver.getState().set(auto.current.next(sample, dt));
    const now = useRun.getState();
    if (now.mode === 'assessment' && now.state.verdict && savedRun.current !== now.runId) finish();
  }, [finish]);

  const exit = () => navigate(ROUTES.SIMULATIONS);
  // free drive's view from behind the car, unless the top-down view is on
  const chaseOn = mode === 'free' && phase === 'drive' && chase && !topDown;

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
    <div className={cn('fixed inset-0 z-[70] overflow-hidden bg-[rgb(var(--road))]', phase === 'explore' && EXPLORE_CANVAS, phase === 'drive' && '[&_canvas]:touch-none')}>
      <Canvas key={tier} dpr={dprFor(spec, 1)} shadows={spec.shadows && 'percentage'} gl={{ powerPreference: 'high-performance' }}>
        <RenderScale spec={spec} />
        {probe && <FrameProbe />}
        <Suspense fallback={null}>
          <Physics timeStep={1 / 60} paused={paused || phase !== 'drive'}>
            <World tier={tier} />
            {sceneryOn && <Scenery tier={tier} />}
            <SwiftCar ref={car} quality={spec} start={start} firstPerson={!topDown && !chaseOn} mirrors={mirrorsOn && phase !== 'explore'} onStep={onStep} onReady={ready_} />
            <OtherCars tier={tier} />
            {trafficOn && <TrafficView tier={tier} traffic={getTraffic} />}
          </Physics>
          <Daylight shadows={spec.shadows} follow={carGroup} />
          {mode !== 'free' && <WhereNext />}
          <ZebraCat eggs={getEggs} />
          <RoofNote />
        </Suspense>
        <TopDownCamera active={topDown} zoom={zoomNow} onZoom={zoomBy} follow={carGroup} />
        {phase === 'explore' && <SpectatorCamera from={carGroup} />}
        <ChaseCamera active={chaseOn} follow={carGroup} />
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
          <Hud
            touch={touch}
            free={mode === 'free'}
            onRestart={() => begin(mode, drill)}
            onStations={() => { if (mode !== 'free') setMode('practice'); go('choose'); }}
            onExit={exit}
          />
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
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--road)/0.92)] p-6" role="alert">
          <div className={`${HUD_PLATE} flex max-w-xs flex-col items-center gap-3 p-5 text-center`}>
            <ArrowsClockwise size={40} />
            <p className="type-label-strong">{t('sim.rotate')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
