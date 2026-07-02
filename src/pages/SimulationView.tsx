import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import Phaser from "phaser";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Lightbulb, Gear, ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, Disc } from "phosphor-react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useSaveSimulationResult } from "@/hooks/useResults";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SimulationHUD } from "@/components/simulation/SimulationHUD";
import { SimulationResults } from "@/components/simulation/SimulationResults";
import { DrivingScene } from "@/games/scenes";
import type { HudCallbacks } from "@/games/scenes";

interface ManeuverConfig {
  name: string;
  nameMs: string;
  instructions: string;
  instructionsMs: string;
  tips: string[];
  clutchTips: string[];
}

const maneuverConfigs: Record<string, ManeuverConfig> = {
  "hill-start": {
    name: "Hill Start",
    nameMs: "Ujian Bukit",
    instructions: "Drive uphill, stop at the marked line, then continue without rolling back more than 30cm.",
    instructionsMs: "Pandu ke atas bukit, berhenti di garisan, kemudian teruskan tanpa mengundur lebih 30cm.",
    tips: [
      "Stop fully at the red line before proceeding. / Berhenti sepenuhnya di garisan merah sebelum meneruskan.",
      "Use handbrake to hold position on the slope. / Guna brek tangan untuk menahan kedudukan di cerun.",
      "Find the clutch biting point before releasing the handbrake. / Cari titik gigitan klac sebelum melepaskan brek tangan.",
      "Apply gentle throttle as you release the clutch slowly. / Beri minyak perlahan semasa melepaskan klac secara beransur.",
      "Do not rush — smooth is better than fast. / Jangan tergesa-gesa — lancar lebih baik daripada laju.",
    ],
    clutchTips: [
      "Press clutch fully and shift to gear / Tekan klac penuh dan masuk gear",
      "Slowly raise clutch until you feel the car vibrate (biting point). / Angkat klac perlahan sehingga rasa kereta bergetar (titik gigitan).",
      "Hold the biting point steady, then add light throttle. / Kekalkan titik gigitan, kemudian tambah minyak ringan.",
      "Release handbrake smoothly — car should move forward. / Lepas brek tangan dengan lancar — kereta bergerak ke hadapan.",
      "If the car rolls back, press clutch and brake immediately. / Jika kereta mengundur, tekan klac dan brek segera.",
    ],
  },
  "side-parking": {
    name: "Side Parking",
    nameMs: "Parkir Tepi",
    instructions: "Drive forward past the bay, then reverse into the parking space without touching poles.",
    instructionsMs: "Pandu ke hadapan melepasi petak, kemudian undur masuk ke petak parkir tanpa menyentuh tiang.",
    tips: [
      "Drive past the parking bay and align your car. / Pandu melepasi petak parkir dan selaraskan kereta.",
      "Check all mirrors before reversing. / Periksa semua cermin sebelum mengundur.",
      "Turn steering wheel fully when rear aligns with first pole. / Pusing stereng penuh apabila belakang sejajar tiang pertama.",
      "Straighten the wheel once inside the bay. / Luruskan stereng sebaik masuk dalam petak.",
      "Ensure the car is centered in the bay. / Pastikan kereta di tengah petak.",
    ],
    clutchTips: [
      "Use half-clutch for slow, controlled reverse movement. / Guna separuh klac untuk undur perlahan terkawal.",
      "Keep clutch at biting point — do not release fully. / Kekalkan klac di titik gigitan — jangan lepas penuh.",
      "Control speed with the clutch, not the brake. / Kawal kelajuan dengan klac, bukan brek.",
    ],
  },
  "parallel-parking": {
    name: "Parallel Parking",
    nameMs: "Parkir Selari",
    instructions: "Park the car parallel between the markers without touching any cones.",
    instructionsMs: "Parkir kereta selari antara penanda tanpa menyentuh kon.",
    tips: [
      "Align parallel to front car, about 1 arm distance. / Selaraskan selari dengan kereta hadapan, 1 lengan jarak.",
      "Reverse slowly, turn wheel fully when rear bumper passes front car. / Undur perlahan, pusing stereng penuh apabila bumper belakang melepasi kereta hadapan.",
      "Once at 45 degrees, straighten the wheel. / Sebaik 45 darjah, luruskan stereng.",
      "Turn wheel fully opposite to straighten near curb. / Pusing stereng penuh sebaliknya untuk lurus di bahu jalan.",
      "Adjust position with small movements. / Laraskan kedudukan dengan pergerakan kecil.",
    ],
    clutchTips: [
      "Half-clutch throughout for maximum control. / Separuh klac sepanjang masa untuk kawalan maksimum.",
      "Feather the clutch — tiny movements matter. / Kawalan halus klac — pergerakan kecil penting.",
    ],
  },
  "three-point-turn": {
    name: "Three-Point Turn",
    nameMs: "Pusingan 3 Penjuru",
    instructions: "Turn the vehicle around using exactly 3 maneuvers as per JPJ test.",
    instructionsMs: "Pusing kenderaan menggunakan tepat 3 manuver mengikut ujian JPJ.",
    tips: [
      "Step 1: Steering FULL LEFT, drive forward slowly to opposite curb. / Langkah 1: Stereng PENUH KIRI, pandu ke hadapan perlahan ke bahu bertentangan.",
      "Step 2: Steering FULL RIGHT, reverse slowly to original curb. / Langkah 2: Stereng PENUH KANAN, undur perlahan ke bahu asal.",
      "Step 3: Steering LEFT, drive forward to straighten. / Langkah 3: Stereng KIRI, pandu ke hadapan untuk meluruskan.",
      "Only 3 movements allowed — forward, reverse, forward. / Hanya 3 pergerakan — hadapan, undur, hadapan.",
      "Do not cross road boundaries. / Jangan melintas sempadan jalan.",
    ],
    clutchTips: [
      "Use half-clutch at all times for slow controlled movement. / Guna separuh klac untuk pergerakan perlahan terkawal.",
      "Press clutch fully before stopping, then find biting point again. / Tekan klac penuh sebelum berhenti, cari titik gigitan semula.",
      "Speed control is critical — never rush. / Kawalan kelajuan kritikal — jangan tergesa-gesa.",
    ],
  },
  "s-curve": {
    name: "S-Curve",
    nameMs: "Selekoh S",
    instructions: "Navigate through the S-shaped course without touching the curbs.",
    instructionsMs: "Navigasi laluan berbentuk S tanpa menyentuh bahu jalan.",
    tips: [
      "Enter the curve slowly — speed control is key. / Masuk selekoh perlahan — kawalan kelajuan kunci.",
      "Look ahead through the curve, not at the curb. / Pandang ke hadapan, bukan bahu jalan.",
      "For right bend, move slightly left first then steer right. / Untuk selekoh kanan, gerak kiri dahulu kemudian stereng kanan.",
      "For left bend, position right before steering left. / Untuk selekoh kiri, posisi kanan sebelum stereng kiri.",
      "Keep a steady slow speed throughout. / Kekalkan kelajuan perlahan tetap.",
    ],
    clutchTips: [
      "Maintain half-clutch for consistent slow speed. / Kekalkan separuh klac untuk kelajuan perlahan konsisten.",
      "Do not accelerate through the curves. / Jangan pecut melalui selekoh.",
    ],
  },
  "z-curve": {
    name: "Z-Curve",
    nameMs: "Selekoh Z",
    instructions: "Navigate through the Z-shaped course without touching the curbs.",
    instructionsMs: "Navigasi laluan berbentuk Z tanpa menyentuh bahu jalan.",
    tips: [
      "Move closer to RIGHT before turning LEFT at corners. / Gerak lebih dekat KANAN sebelum belok KIRI.",
      "Move closer to LEFT before turning RIGHT at corners. / Gerak lebih dekat KIRI sebelum belok KANAN.",
      "This gives the widest turning arc. / Ini memberi lengkok pusingan paling luas.",
      "Look ahead to the next corner. / Pandang to selekoh seterusnya.",
      "Maintain very slow steady speed. / Kekalkan kelajuan sangat perlahan dan tetap.",
    ],
    clutchTips: [
      "Half-clutch is your best friend here. / Separuh klac sahabat terbaik anda di sini.",
      "If you need to stop, press clutch fully first. / Jika perlu berhenti, tekan klac penuh dahulu.",
    ],
  },
  "ramp-test": {
    name: "Ramp Test",
    nameMs: "Ujian Ramp",
    instructions: "Drive up the ramp, stop at the top, then continue down smoothly.",
    instructionsMs: "Pandu naik tanjakan, berhenti di atas, kemudian turun dengan lancar.",
    tips: [
      "Approach the ramp in gear 1 with steady speed. / Hampiri tanjakan dalam gear 1 dengan kelajuan tetap.",
      "Stop at the designated stop line at the top. / Berhenti di garisan berhenti di atas.",
      "Use same technique as hill start to move off. / Guna teknik sama seperti permulaan bukit.",
      "When descending, use engine braking (low gear). / Semasa menurun, guna brek enjin (gear rendah).",
      "Apply brakes gently when going downhill. / Tekan brek perlahan semasa turun.",
    ],
    clutchTips: [
      "Going up: find biting point, add gas, release handbrake. / Naik: cari titik gigitan, tambah minyak, lepas brek tangan.",
      "Going down: press clutch, shift to gear 1, release slowly for engine braking. / Turun: tekan klac, masuk gear 1, lepas perlahan.",
      "Never ride the clutch going downhill. / Jangan pegang klac semasa turun bukit.",
    ],
  },
  "road-merging": {
    name: "Road Merging",
    nameMs: "Bergabung Jalan",
    instructions: "Merge safely into moving traffic. Watch for other vehicles and find gaps.",
    instructionsMs: "Bergabung dengan selamat ke dalam trafik bergerak. Perhatikan kenderaan lain dan cari ruang.",
    tips: [
      "Check mirrors and blind spot before merging. / Periksa cermin dan blind spot sebelum bergabung.",
      "Match the speed of traffic in the lane you are entering. / Padankan kelajuan trafik di lorong yang anda masuki.",
      "Use the acceleration lane to build speed. / Guna lorong pecutan untuk tingkatkan kelajuan.",
      "Signal early to indicate your intention. / Beri isyarat awal untuk tunjukkan niat anda.",
      "Do not stop on the acceleration lane unless absolutely necessary. / Jangan berhenti di lorong pecutan kecuali sangat perlu.",
    ],
    clutchTips: [
      "Build speed steadily — keep clutch fully released in higher gear. / Tingkatkan kelajuan secara tetap.",
      "Downshift if you need to slow down quickly. / Turunkan gear jika perlu perlahan segera.",
    ],
  },
};

const VALID_MANEUVERS = new Set(Object.keys(maneuverConfigs));

type Phase = "pre-launch" | "playing" | "results";
type Mode = "practice" | "assessment";

export function SimulationView() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const saveResult = useSaveSimulationResult();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<DrivingScene | null>(null);
  const hudCallbacksRef = useRef<HudCallbacks>({
    onSpeedChange: () => { },
    onErrorIncrement: () => { },
    onStallIncrement: () => { },
    onMirrorCheck: () => { },
    onSignalChange: () => { },
    onFinish: () => { },
  });
  const savedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("pre-launch");
  const [mode, setMode] = useState<Mode>("practice");
  const [gameKey, setGameKey] = useState(0);

  const [hudState, setHudState] = useState({
    leftSignal: false,
    rightSignal: false,
    mirrorChecked: false,
    errors: 0,
    speed: 0,
  });

  const [resultData, setResultData] = useState({
    score: 0,
    errors: 0,
    stallCount: 0,
    rollbackCm: 0,
    passed: false,
  });

  const maneuverId = id && VALID_MANEUVERS.has(id) ? id : "hill-start";
  const config = maneuverConfigs[maneuverId];
  const maneuverName = language === "ms" ? config.nameMs : config.name;

  const handleSpeedChange = useCallback((speed: number) => {
    setHudState((prev) => ({ ...prev, speed }));
  }, []);

  const handleErrorIncrement = useCallback(() => {
    setHudState((prev) => ({ ...prev, errors: prev.errors + 1 }));
  }, []);

  const handleFinish = useCallback((data: {
    score: number;
    errors: number;
    stallCount: number;
    rollbackCm: number;
    passed: boolean;
  }) => {
    setResultData(data);
    setPhase("results");

    if (savedRef.current || !user) return;
    savedRef.current = true;

    const completionSeconds = sceneRef.current?.completionTime ?? null;

    saveResult.mutate(
      {
        user_id: user.id,
        maneuver_id: maneuverId,
        mode,
        score: data.score,
        errors: data.errors,
        passed: data.passed,
        completion_seconds: completionSeconds,
        stall_count: data.stallCount,
        rollback_cm: data.rollbackCm,
        language,
        attempt_data: {},
      },
      {
        onSuccess: () => {
          toast.success(t("sim.resultSaved"));
        },
        onError: () => {
          savedRef.current = false;
          toast.error(t("sim.resultSaveFailed"));
        },
      }
    );
  }, [user, maneuverId, mode, language, saveResult.mutate, t]);

  useLayoutEffect(() => {
    hudCallbacksRef.current = {
      onSpeedChange: handleSpeedChange,
      onErrorIncrement: handleErrorIncrement,
      onStallIncrement: () => { },
      onMirrorCheck: () => { },
      onSignalChange: () => { },
      onFinish: handleFinish,
    };
  });

  useEffect(() => {
    if (phase !== "playing" || !gameContainerRef.current) return;

    let cancelled = false;
    let game: Phaser.Game | null = null;
    let resizeHandler: (() => void) | null = null;

    const mountGame = () => {
      const container = gameContainerRef.current;
      if (!container || cancelled) return;

      const scene = new DrivingScene(maneuverId);
      const width = Math.max(container.clientWidth, 320);

      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width,
        height: 450,
        backgroundColor: "#2d5a27",
        scene,
        physics: { default: "arcade" },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        hudCallbacksRef,
      } as any);

      phaserGameRef.current = game;
      sceneRef.current = game.scene.getScene("DrivingScene") as DrivingScene;

      resizeHandler = () => {
        if (!gameContainerRef.current || !phaserGameRef.current) return;
        phaserGameRef.current.scale.resize(
          Math.max(gameContainerRef.current.clientWidth, 320),
          450
        );
      };

      resizeHandler();
      window.addEventListener("resize", resizeHandler);
    };

    const frameId = requestAnimationFrame(mountGame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (game) {
        game.destroy(true);
      }
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, [phase, maneuverId, gameKey]);

  const handleStart = () => {
    savedRef.current = false;
    setPhase("playing");
  };

  const handleRetry = () => {
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true);
      phaserGameRef.current = null;
    }
    sceneRef.current = null;
    savedRef.current = false;
    setGameKey((k) => k + 1);
    setPhase("pre-launch");
    setHudState({ leftSignal: false, rightSignal: false, mirrorChecked: false, errors: 0, speed: 0 });
    setResultData({ score: 0, errors: 0, stallCount: 0, rollbackCm: 0, passed: false });
  };

  const handleBack = () => {
    navigate(ROUTES.SIMULATIONS);
  };

  const handleTouch = (dir: "up" | "down" | "left" | "right", pressed: boolean) => {
    sceneRef.current?.setTouchControl(dir, pressed);
  };

  const handleLeftSignal = () => {
    setHudState((prev) => {
      const leftSignal = !prev.leftSignal;
      const rightSignal = leftSignal ? false : prev.rightSignal;
      sceneRef.current?.setSignal(leftSignal ? "left" : rightSignal ? "right" : "none");
      return { ...prev, leftSignal, rightSignal };
    });
  };

  const handleRightSignal = () => {
    setHudState((prev) => {
      const rightSignal = !prev.rightSignal;
      const leftSignal = rightSignal ? false : prev.leftSignal;
      sceneRef.current?.setSignal(rightSignal ? "right" : leftSignal ? "left" : "none");
      return { ...prev, rightSignal, leftSignal };
    });
  };

  const handleMirrorCheck = () => {
    setHudState((prev) => ({ ...prev, mirrorChecked: true }));
    sceneRef.current?.setMirrorCheck(true);
    window.setTimeout(() => sceneRef.current?.setMirrorCheck(false), 1500);
  };

  return (
    <div className="page-shell max-w-5xl space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      {phase === "pre-launch" && (
        <div className="max-w-xl mx-auto card-premium p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2 border-b border-border pb-4">
            <h1 className="font-heading text-2xl font-bold text-foreground">{maneuverName}</h1>
            <p className="text-muted-foreground text-sm max-w-readable mx-auto">
              {language === "ms" ? config.instructionsMs : config.instructions}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips Section */}
            <div className="p-4 rounded-lg bg-accent/40 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-bold text-foreground">
                  {t("sim.tips")}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside">
                {config.tips.map((tip, index) => (
                  <li key={index} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Clutch Control Section */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {language === "ms" ? "Kawalan Klac & Manual" : "Clutch & Manual Control"}
                </span>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                {config.clutchTips.map((tip, index) => (
                  <li key={index} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Gear className="w-4 h-4 text-muted-foreground" weight="regular" />
              {t("sim.modeLabel")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["practice", "assessment"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-[48px] py-3 px-4 rounded-md border font-medium text-sm transition-colors duration-200 capitalize",
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-accent/50"
                  )}
                >
                  {t(m === "practice" ? "sim.mode.practice" : "sim.mode.assessment")}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-md border border-border bg-muted/50 text-xs text-muted-foreground">
            <p className="font-medium mb-1 text-foreground">{t("sim.controls")}</p>
            <ul className="list-disc list-inside space-y-0.5 max-w-readable">
              <li>{t("sim.control.steer")}</li>
              <li>{t("sim.control.brake")}</li>
              <li>{t("sim.control.signal")}</li>
              <li>{t("sim.control.mirror")}</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full min-h-[48px] py-3 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Play className="w-5 h-5" />
            {t("sim.start")}
          </button>
        </div>
      )}

      {phase === "playing" && (
        <div className="space-y-4">
          <SimulationHUD
            leftSignal={hudState.leftSignal}
            rightSignal={hudState.rightSignal}
            mirrorChecked={hudState.mirrorChecked}
            errors={hudState.errors}
            speed={hudState.speed}
            onMirrorCheck={handleMirrorCheck}
            onLeftSignal={handleLeftSignal}
            onRightSignal={handleRightSignal}
          />

          <div
            ref={gameContainerRef}
            className="w-full min-h-[450px] aspect-[13/9] bg-[#2d5a27] rounded-md border border-border overflow-hidden"
          />

          <div className="md:hidden grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            <div />
            <TouchButton onPress={(p) => handleTouch("up", p)}><ArrowUp className="w-5 h-5" /></TouchButton>
            <div />
            <TouchButton onPress={(p) => handleTouch("left", p)}><ArrowLeftIcon className="w-5 h-5" /></TouchButton>
            <TouchButton onPress={(p) => handleTouch("down", p)}><ArrowDown className="w-5 h-5" /></TouchButton>
            <TouchButton onPress={(p) => handleTouch("right", p)}><ArrowRight className="w-5 h-5" /></TouchButton>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("sim.control.steer")} · {t("sim.control.signal")}
          </p>
        </div>
      )}

      {phase === "results" && (
        <SimulationResults
          maneuverName={maneuverName}
          score={resultData.score}
          errors={resultData.errors}
          stallCount={resultData.stallCount}
          rollbackCm={resultData.rollbackCm}
          passed={resultData.passed}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

function TouchButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: (pressed: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="h-14 rounded-md border border-border bg-card text-foreground flex items-center justify-center active:bg-accent"
      onTouchStart={() => onPress(true)}
      onTouchEnd={() => onPress(false)}
      onMouseDown={() => onPress(true)}
      onMouseUp={() => onPress(false)}
      onMouseLeave={() => onPress(false)}
    >
      {children}
    </button>
  );
}
