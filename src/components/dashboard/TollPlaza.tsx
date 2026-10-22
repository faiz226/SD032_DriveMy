import { Link } from "react-router-dom";
import type { Icon } from "@/components/ui/icons";
import { ArrowRight, Check, Clock } from "@/components/ui/icons";
import { Pill, type PillTone } from "@/components/ui/surface";
import { useLanguage } from "@/hooks/useLanguage";
import type { LearningState } from "@/lib/dashboard/model";
import { cn } from "@/lib/utils";

export interface Lane {
  /** Short word on the overhead lane board, e.g. "KPP 01". */
  sign: string;
  title: string;
  description: string;
  to: string;
  state: LearningState;
  /** A reference module rather than something to complete. */
  info?: boolean;
}

/** Lane boards take the look of a Malaysian plaza's payment lanes, without their brands. */
type Board = "blue" | "yellow" | "white";
const BOARDS: Board[] = ["blue", "yellow", "white"];

/**
 * A Malaysian toll plaza: green tiled roof with a white gable, a dark fascia
 * carrying the plaza's name, and one lane per module. Each lane has its pipe
 * frame with the class sign, lane light and lane board; the red and white
 * height-limit bar across the entrance; the booth's notice board; and the toll
 * barrier, which lifts as you drive in (hover, focus or tap). The approach road
 * runs toward the viewer in perspective. On a phone the plaza is wider than the
 * screen and slides sideways.
 */
export function TollPlaza({ name, lanes, firstLane }: { name: string; lanes: Lane[]; firstLane: number }) {
  return (
    <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <div className="relative min-w-[52rem] overflow-hidden rounded-[1.5rem] ring-1 ring-border md:min-w-0">
        <PlazaRoof name={name} />
        <div className="relative grid grid-cols-3 bg-[linear-gradient(180deg,#2a3540,#1a222a)]">
          {lanes.map((lane, index) => (
            <TollLane key={lane.to + lane.title} lane={lane} number={firstLane + index} board={BOARDS[index % BOARDS.length]} first={index === 0} />
          ))}
        </div>
        <ApproachRoad lanes={lanes.length} />
      </div>
    </div>
  );
}

/** Roof, gable and fascia. Decorative; the plaza name is real text. */
function PlazaRoof({ name }: { name: string }) {
  const { t } = useLanguage();
  return (
    <div className="relative">
      <div aria-hidden="true" className="relative h-[5.5rem]">
        {/* Tiled wings, narrowing toward the ridge. */}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-[repeating-linear-gradient(180deg,#2f9461_0_9px,#1f6e46_9px_11px),repeating-linear-gradient(90deg,transparent_0_26px,rgb(0_0_0/0.12)_26px_28px)] [background-blend-mode:multiply] [clip-path:polygon(0_100%,4%_0,96%_0,100%_100%)]" />
        {/* The gable: white pediment, upturned eaves, a fan window. */}
        <svg viewBox="0 0 320 120" className="absolute bottom-0 left-1/2 h-[5.5rem] w-auto -translate-x-1/2" aria-hidden="true">
          <path d="M0 120 Q58 116 86 84 L160 6 L234 84 Q262 116 320 120 Z" fill="#f2f5f7" />
          <path d="M62 112 Q92 104 108 80 L160 26 L212 80 Q228 104 258 112 Z" fill="#26343f" />
          <path d="M112 104 A48 48 0 0 1 208 104 Z" fill="#f2f5f7" opacity="0.92" />
          {[-70, -50, -30, -10, 10, 30, 50, 70].map(angle => (
            <line key={angle} x1="160" y1="104" x2={160 + 46 * Math.sin((angle * Math.PI) / 180)} y2={104 - 46 * Math.cos((angle * Math.PI) / 180)} stroke="#26343f" strokeWidth="2" />
          ))}
        </svg>
      </div>
      {/* Fascia: a white trim, then the dark band with the plaza's name, which
          rides along at the left edge on a phone as the lanes slide past. */}
      <div aria-hidden="true" className="h-2 bg-[#e8edf0]" />
      <div className="flex h-11 items-center bg-[linear-gradient(180deg,#22303b,#18232c)] px-4 text-white md:justify-center">
        <span className="sticky left-4 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white/70">{t("dashboard.lanes.plaza")}</span>
          <span className="text-lg font-black tracking-[-0.01em]">{name}</span>
        </span>
      </div>
    </div>
  );
}

function TollLane({ lane, number, board, first }: { lane: Lane; number: number; board: Board; first: boolean }) {
  const { t } = useLanguage();
  const kind = lane.info && lane.state === "open" ? "info" : lane.state;
  const chip: { tone: PillTone; label: string; icon: Icon } =
    kind === "done" ? { tone: "success", label: t("dashboard.exits.state.done"), icon: Check }
      : kind === "progress" ? { tone: "brand", label: t("dashboard.exits.state.progress"), icon: Clock }
        : kind === "info" ? { tone: "info", label: t("dashboard.exits.state.info"), icon: ArrowRight }
          : { tone: "neutral", label: t("dashboard.exits.state.open"), icon: ArrowRight };
  const ChipIcon = chip.icon;

  return (
    <Link to={lane.to} className="group relative flex flex-col items-stretch px-5 pb-5 pt-5 text-white no-underline outline-none">
      {/* Island posts at the lane edges hold the height-limit bar. */}
      {first && <Island side="left" />}
      <Island side="right" />

      {/* White pipe frame over the lane, with the class sign and lane light. */}
      <span aria-hidden="true" className="relative mx-1 rounded-t-[1.25rem] border-[5px] border-b-0 border-[#eef2f4] px-3 pb-3 pt-7 shadow-[0_6px_14px_-8px_rgb(0_0_0/0.7)]">
        <ClassSign />
        <LaneLight kind={kind} number={number} />
        <LaneBoard board={board}>{lane.sign}</LaneBoard>
      </span>

      {/* Height limit at the entrance: a fixed red and white bar between the
          posts, with its round 2.1 m sign. It never moves. */}
      <span aria-hidden="true" className="relative -mx-5 my-2 block h-6">
        <span className="absolute inset-x-0 top-2 h-2.5 bg-[repeating-linear-gradient(90deg,#fff_0_16px,rgb(var(--plate-red))_16px_32px)] shadow-[0_2px_4px_rgb(0_0_0/0.5)]" />
        <span className="absolute right-7 top-0 grid h-7 w-7 place-items-center rounded-full border-[3px] border-plate-red bg-white text-[0.5625rem] font-black leading-none text-[#111] shadow-[0_2px_4px_rgb(0_0_0/0.5)]">2.1m</span>
      </span>

      {/* The booth's notice board: what this lane is and where it stands. It
          fills the lane so every barrier sits at the same height. */}
      <span className="relative z-10 mx-1 mt-1 flex flex-1 flex-col items-start rounded-xl bg-[#fbfcfd] p-3.5 text-[#0B1A2A] shadow-[0_10px_20px_-10px_rgb(0_0_0/0.8)] ring-1 ring-black/10 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-brand">
        <span className="block text-[1.0625rem] font-extrabold leading-tight tracking-[-0.01em]">{lane.title}</span>
        <span className="mb-3 mt-1 block text-sm leading-snug text-[#455F77]">{lane.description}</span>
        <Pill tone={chip.tone} className="mt-auto !text-[#0B1A2A]">
          <ChipIcon size={14} weight="bold" aria-hidden="true" />{chip.label}
        </Pill>
      </span>

      {/* The toll barrier at the booth: a cabin on the right and an arm across
          the lane in front of everything, which swings upright as you drive in.
          Raised, it runs up the right edge, clear of the board's text. */}
      <span aria-hidden="true" className="relative z-20 mt-3 block h-10">
        <span className="absolute -right-3 bottom-0 h-10 w-7 rounded-t-md bg-[linear-gradient(180deg,#d9dee2,#9aa3ab)] shadow-[0_2px_6px_rgb(0_0_0/0.5)]">
          <span className="absolute inset-x-1 top-1.5 h-3 rounded-sm bg-[#2b4a63]" />
        </span>
        <span className="absolute bottom-3 right-4 h-2.5 w-[min(calc(100%-1.5rem),15rem)] origin-[calc(100%-0.25rem)_50%] rounded-full bg-[repeating-linear-gradient(90deg,rgb(var(--plate-red))_0_14px,#fff_14px_28px)] shadow-[0_3px_6px_rgb(0_0_0/0.55)] transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:rotate-[84deg] group-focus-visible:rotate-[84deg] group-active:rotate-[84deg] motion-reduce:transition-none" />
      </span>
    </Link>
  );
}

/** The road in front of the plaza, drawn toward the viewer: stop line, lane lines that spread as they near, lane arrows. */
function ApproachRoad({ lanes }: { lanes: number }) {
  const W = 1200;
  const H = 150;
  const spread = 1.35;
  const xs = Array.from({ length: lanes + 1 }, (_, i) => (W / lanes) * i);
  const far = (x: number) => x;
  const near = (x: number) => W / 2 + (x - W / 2) * spread;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-32 w-full">
      <defs>
        <linearGradient id="approach-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2d3640" />
          <stop offset="1" stopColor="#11171d" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#approach-road)" />
      <rect width={W} height="7" fill="#e8edf0" opacity="0.85" />
      {xs.map((x, i) => {
        const edge = i === 0 || i === lanes;
        return (
          <line
            key={x}
            x1={far(x)} y1="7" x2={near(x)} y2={H}
            stroke={edge ? "#F2B705" : "#e8edf0"}
            strokeWidth="4"
            strokeDasharray={edge ? undefined : "18 16"}
            vectorEffect="non-scaling-stroke"
            opacity="0.85"
          />
        );
      })}
      {xs.slice(0, -1).map((x, i) => {
        const cx = (far(x) + far(xs[i + 1])) / 2;
        return (
          <path
            key={cx}
            d={`M${cx - 26} 112 L${cx - 26} 84 L${cx - 52} 84 L${cx} 44 L${cx + 52} 84 L${cx + 26} 84 L${cx + 26} 112 Z`}
            fill="#e8edf0"
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

/** The red "cars only" class sign at the top of each lane frame. */
function ClassSign() {
  return (
    <span className="absolute -top-[1.1rem] left-1/2 flex -translate-x-1/2 flex-col items-center rounded-[4px] border-2 border-white bg-plate-red px-2 pb-0.5 pt-1 shadow-[0_2px_6px_rgb(0_0_0/0.5)]">
      <svg width="30" height="12" viewBox="0 0 30 12" aria-hidden="true">
        <path d="M2 9V6.5L5 6l3-4h11l4 4 4 .6V9z" fill="#fff" />
        <circle cx="8" cy="9.5" r="2" className="fill-plate-red" stroke="#fff" strokeWidth="1.4" />
        <circle cx="22" cy="9.5" r="2" className="fill-plate-red" stroke="#fff" strokeWidth="1.4" />
      </svg>
      <span className="text-[0.5625rem] font-black leading-none tracking-[0.08em] text-white">SAHAJA</span>
    </span>
  );
}

/** The lane light: green when open or done, amber while in progress, with the lane number. */
function LaneLight({ kind, number }: { kind: LearningState | "info"; number: number }) {
  const amber = kind === "progress";
  return (
    <span className="absolute -right-2 -top-3 flex items-center gap-1.5 rounded-md bg-[#0b0f13] px-1.5 py-1 ring-1 ring-white/15">
      <span className="type-vms text-xs leading-none text-vms">{String(number).padStart(2, "0")}</span>
      <span className={cn(
        "grid h-4 w-4 place-items-center rounded-full",
        amber ? "bg-vms shadow-[0_0_10px_2px_rgb(var(--vms)/0.8)]" : "bg-[#2bdc7a] shadow-[0_0_10px_2px_rgb(43_220_122/0.8)]",
      )}>
        {kind === "done" && <Check size={10} strokeWidth={4} className="text-[#06351c]" />}
      </span>
    </span>
  );
}

/** The coloured board over the lane, styled after plaza payment boards. */
function LaneBoard({ board, children }: { board: Board; children: React.ReactNode }) {
  return (
    <span className={cn(
      "flex min-h-[4.25rem] items-center justify-center rounded-md px-3 text-center shadow-[0_6px_12px_-6px_rgb(0_0_0/0.7)]",
      board === "blue" && "border-[3px] border-white bg-[#1f5fbf]",
      board === "yellow" && "border-[3px] border-[#1a1a1a] bg-[#f6c21a]",
      board === "white" && "border-[3px] border-[#d5dbe0] bg-white",
    )}>
      <span className={cn(
        "text-[1.625rem] font-black italic leading-none tracking-[-0.02em]",
        board === "blue" && "text-[#f6c21a] [text-shadow:0_2px_0_rgb(0_0_0/0.35)]",
        board === "yellow" && "text-[#123f9a]",
        board === "white" && "text-[#1b3d8f]",
      )}>
        {children}
      </span>
    </span>
  );
}

/** A lane-end island: red and white post up to the height bar, yellow and black chevron cushion at its foot. */
function Island({ side }: { side: "left" | "right" }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute bottom-0 top-[9.25rem] z-0 flex w-10 flex-col items-center", side === "left" ? "-left-5" : "-right-5")}>
      <span className="w-2.5 flex-1 rounded-sm bg-[repeating-linear-gradient(180deg,#fff_0_9px,rgb(var(--plate-red))_9px_18px)]" />
      <span className="h-9 w-10 rounded-t-md bg-[repeating-linear-gradient(-45deg,#f6c21a_0_8px,#111_8px_16px)] shadow-[0_-2px_6px_rgb(0_0_0/0.4)]" />
    </span>
  );
}
