/**
 * One flat illustration per RPK / RSM part, drawn in-house in one style: 2 px rounded outlines, fills from the
 * app's colour tokens, so each picture follows the light and dark theme. Every picture is a 400 x 300 viewBox;
 * `HOTSPOTS` says where each numbered step sits on it. No text lives inside a picture except the gear letters.
 */
import type { ReactNode } from "react";

const body = "fill-muted stroke-foreground/50";
const panel = "fill-card stroke-foreground/50";
const glass = "fill-info/20 stroke-foreground/40";
const ink = "fill-foreground/75 stroke-foreground/60";
const soft = "fill-foreground/10 stroke-foreground/30";
const brand = "fill-brand stroke-foreground/50";
const red = "fill-destructive stroke-foreground/40";
const green = "fill-success stroke-foreground/40";
const line = "fill-none stroke-foreground/60";
const guide = "fill-none stroke-foreground/30";

/** Where each step's number sits on its picture, in viewBox units (0-400, 0-300), in step order. */
export const HOTSPOTS: Record<string, [number, number][]> = {
  "rpk-exterior": [[278, 92], [278, 205], [327, 116], [266, 150], [190, 150], [111, 150], [200, 248]],
  "rpk-engine": [[160, 64], [302, 135], [344, 137], [252, 240], [307, 190], [172, 150], [96, 150], [325, 72]],
  "rpk-boot": [[50, 50], [138, 50], [226, 50], [314, 50], [50, 176], [138, 176], [226, 176], [314, 176]],
  "rsm-position": [[158, 178], [206, 226], [250, 90], [184, 152], [322, 166], [92, 111]],
  "rsm-mirrors": [[200, 55], [58, 60], [150, 162], [196, 236]],
  "rsm-controls": [[135, 152], [324, 96], [150, 236], [335, 236]],
};

function Exterior() {
  return (
    <>
      <rect x="44" y="70" width="312" height="160" rx="60" className={guide} strokeDasharray="6 8" />
      <polygon points="208,66 194,58 194,74" className="fill-foreground/30 stroke-none" />
      {[[105, 86], [105, 196], [255, 86], [255, 196]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="46" height="18" rx="5" className={ink} />)}
      <rect x="70" y="100" width="260" height="100" rx="34" className={body} />
      <rect x="130" y="112" width="118" height="76" rx="14" className={panel} />
      <polygon points="250,112 278,125 278,175 250,188" className={glass} />
      <polygon points="122,118 100,128 100,172 122,182" className={glass} />
      <rect x="322" y="106" width="10" height="18" rx="4" className={brand} />
      <rect x="322" y="176" width="10" height="18" rx="4" className={brand} />
      <rect x="68" y="106" width="8" height="18" rx="3" className={red} />
      <rect x="68" y="176" width="8" height="18" rx="3" className={red} />
      <rect x="234" y="94" width="14" height="9" rx="3" className={ink} />
      <rect x="234" y="197" width="14" height="9" rx="3" className={ink} />
      <path d="M276 172 L254 130 M276 150 L256 120" className={line} strokeWidth="3.5" />
      {[170, 200, 230].map((x, i) => <path key={x} d={`M${x} ${236 + (i === 1 ? 10 : 0)} q-7 10 0 14 q7 -4 0 -14z`} className="fill-info stroke-foreground/40" />)}
    </>
  );
}

function Engine() {
  return (
    <>
      <rect x="30" y="30" width="340" height="240" rx="22" className={panel} />
      <rect x="40" y="56" width="26" height="188" rx="6" className={body} />
      <circle cx="53" cy="44" r="9" className={brand} />
      <path d="M66 100 C100 62 128 78 140 100 M66 204 C100 240 128 224 140 204" className="fill-none stroke-info" strokeWidth="6" />
      <circle cx="96" cy="150" r="36" className={soft} />
      {[0, 90].map(a => <ellipse key={a} cx="96" cy="150" rx="34" ry="9" transform={`rotate(${a + 25} 96 150)`} className={ink} />)}
      <circle cx="96" cy="150" r="7" className={panel} />
      <rect x="140" y="80" width="130" height="140" rx="10" className={body} />
      {[0, 1, 2, 3].map(i => <rect key={i} x={152 + i * 28} y="94" width="20" height="26" rx="4" className={soft} />)}
      <polygon points="150,108 180,146 150,196 138,150" className={line} strokeWidth="4" />
      {[[150, 112, 11], [150, 190, 11], [180, 150, 8]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} className={ink} />)}
      <path d="M160 74 v22" className={line} strokeWidth="3" /><circle cx="160" cy="66" r="7" className={brand} />
      <path d="M252 220 v10" className={line} strokeWidth="3" /><circle cx="252" cy="238" r="7" className={brand} />
      <rect x="290" y="50" width="70" height="44" rx="6" className={ink} />
      <rect x="298" y="42" width="12" height="9" rx="2" className={red} /><rect x="340" y="42" width="12" height="9" rx="2" className={green} />
      <rect x="285" y="114" width="34" height="42" rx="6" className={glass} /><path d="M289 138 h26" className={line} />
      <rect x="330" y="120" width="30" height="36" rx="6" className={glass} /><path d="M334 142 h22" className={line} />
      <rect x="285" y="170" width="44" height="40" rx="6" className={glass} /><path d="M289 192 h36" className={line} />
      <rect x="334" y="172" width="26" height="76" rx="6" className={glass} /><path d="M338 214 h18" className={line} />
    </>
  );
}

function Tile({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width="82" height="112" rx="12" className={body} />
      <g transform={`translate(${x + 41} ${y + 62})`}>{children}</g>
    </g>
  );
}

function Boot() {
  return (
    <>
      <rect x="20" y="20" width="360" height="260" rx="18" className={panel} />
      <Tile x={34} y={34}>
        <polygon points="0,-30 32,24 -32,24" className={red} />
        <polygon points="0,-12 15,12 -15,12" className={panel} />
      </Tile>
      <Tile x={122} y={34}>
        <rect x="-30" y="-20" width="60" height="44" rx="7" className={panel} />
        <path d="M-10 -20 v-8 h20 v8" className={line} />
        <rect x="-5" y="-10" width="10" height="24" className={red} /><rect x="-12" y="-3" width="24" height="10" className={red} />
      </Tile>
      <Tile x={210} y={34}>
        <rect x="-8" y="-20" width="16" height="48" rx="4" className={ink} />
        <rect x="-15" y="-32" width="30" height="14" rx="4" className={brand} />
        <path d="M-22 -40 l-8 -6 M0 -44 v-8 M22 -40 l8 -6" className={guide} />
      </Tile>
      <Tile x={298} y={34}>
        <rect x="-14" y="-8" width="28" height="42" rx="9" className={red} />
        <rect x="-6" y="-22" width="12" height="14" rx="3" className={ink} />
        <path d="M6 -20 q22 0 22 20 M-10 -26 h14" className={line} strokeWidth="3" />
      </Tile>
      <Tile x={34} y={160}>
        <polygon points="-26,14 0,-14 26,14 0,26" className={brand} />
        <path d="M-26 -32 l52 -4" className={line} strokeWidth="6" /><circle cx="-26" cy="-32" r="7" className={ink} />
      </Tile>
      <Tile x={122} y={160}>
        <path d="M-26 -22 q14 -14 28 0 t24 -2" className="fill-none stroke-destructive" strokeWidth="4" />
        <rect x="-30" y="-30" width="12" height="16" rx="3" className={ink} /><rect x="14" y="-30" width="12" height="16" rx="3" className={ink} />
        <circle cx="0" cy="14" r="20" className={soft} /><circle cx="0" cy="14" r="9" className={panel} />
      </Tile>
      <Tile x={210} y={160}>
        <path d="M-26 -26 l20 20 a9 9 0 1 0 12 -12 z" className={ink} />
        <path d="M24 -28 v50" className={line} strokeWidth="7" /><rect x="18" y="-34" width="12" height="14" rx="3" className={brand} />
        <path d="M-24 28 l30 -8" className={line} strokeWidth="5" />
      </Tile>
      <Tile x={298} y={160}>
        <rect x="-18" y="-20" width="36" height="48" rx="9" className={glass} />
        <rect x="-18" y="2" width="36" height="26" rx="9" className="fill-info/45 stroke-foreground/40" />
        <rect x="-7" y="-30" width="14" height="10" rx="3" className={ink} />
      </Tile>
    </>
  );
}

function Position() {
  return (
    <>
      <rect x="30" y="248" width="340" height="10" rx="4" className={soft} />
      <polygon points="270,150 362,138 372,202 292,208" className={body} />
      <path d="M254 126 L292 200" className={line} strokeWidth="5" />
      <rect x="244" y="92" width="10" height="64" rx="5" transform="rotate(16 249 124)" className={ink} />
      <polygon points="90,214 76,134 104,128 118,214" className={panel} />
      <rect x="92" y="212" width="90" height="22" rx="9" className={panel} />
      <rect x="78" y="96" width="28" height="28" rx="9" className={brand} />
      <path d="M118 208 L186 196 L226 240" className="fill-none stroke-foreground/30" strokeWidth="14" />
      <path d="M110 134 L116 206" className="fill-none stroke-foreground/30" strokeWidth="20" />
      <circle cx="112" cy="106" r="16" className={panel} />
      <path d="M112 138 L184 152 L240 124" className="fill-none stroke-foreground/30" strokeWidth="11" />
      <path d="M112 138 L250 92" className={guide} strokeDasharray="5 7" />
      <path d="M170 204 a20 20 0 0 1 14 18" className="fill-none stroke-brand" strokeWidth="4" strokeDasharray="4 5" />
      <path d="M168 156 a16 16 0 0 0 10 -12" className="fill-none stroke-brand" strokeWidth="4" strokeDasharray="4 5" />
      <rect x="226" y="242" width="30" height="8" rx="3" className={ink} />
      <rect x="264" y="240" width="22" height="9" rx="3" className={ink} />
      <path d="M140 216 L158 182" className={line} strokeWidth="5" /><circle cx="158" cy="178" r="7" className={brand} />
      <path d="M204 216 L206 172" className={line} strokeWidth="4" /><circle cx="206" cy="168" r="6" className={ink} />
      {[[306, 170], [330, 168], [352, 166]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="6" className={brand} />)}
    </>
  );
}

function Mirrors() {
  return (
    <>
      <rect x="110" y="20" width="180" height="70" rx="14" className={glass} />
      <polygon points="130,86 270,86 216,28 184,28" className={soft} /><path d="M200 86 V30" className={guide} strokeDasharray="5 6" />
      <rect x="178" y="42" width="44" height="30" rx="7" className={body} /><rect x="182" y="58" width="9" height="6" rx="2" className={red} /><rect x="209" y="58" width="9" height="6" rx="2" className={red} />
      <rect x="20" y="30" width="76" height="60" rx="12" className={glass} />
      <rect x="304" y="30" width="76" height="60" rx="12" className={glass} />
      <rect x="77" y="36" width="19" height="48" rx="4" className={body} />
      <rect x="304" y="36" width="19" height="48" rx="4" className={body} />
      <path d="M30 84 L70 40 M370 84 L330 40" className={line} />
      <rect x="116" y="200" width="82" height="22" rx="9" className={panel} />
      <rect x="116" y="130" width="40" height="76" rx="14" className={soft} />
      <circle cx="136" cy="116" r="16" className={panel} />
      <path d="M150 140 L202 230" className="fill-none stroke-brand" strokeWidth="8" />
      <path d="M118 232 h84" className="fill-none stroke-brand" strokeWidth="8" />
      <rect x="196" y="224" width="20" height="20" rx="5" className={ink} />
      <rect x="244" y="190" width="100" height="50" rx="10" className={ink} />
      <rect x="258" y="206" width="48" height="18" rx="4" className={panel} />
      <rect x="226" y="200" width="68" height="30" rx="6" className={brand} />
      <polygon points="336,150 360,150 348,168" className="fill-foreground/30 stroke-none" transform="rotate(-90 348 160)" />
    </>
  );
}

function Controls() {
  return (
    <>
      <rect x="20" y="20" width="236" height="150" rx="22" className={body} />
      {[80, 196].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="86" r="48" className={panel} />
          <path d={`M${cx - 36} 106 A42 42 0 1 1 ${cx + 36} 106`} className={guide} strokeDasharray="3 7" strokeWidth="4" />
          <path d={`M${cx} 86 L${cx + (cx === 80 ? 22 : -26)} ${cx === 80 ? 62 : 64}`} className={line} strokeWidth="4" />
          <circle cx={cx} cy="86" r="6" className={ink} />
        </g>
      ))}
      {[[52, "red"], [76, "brand"], [100, "green"], [124, "brand"], [148, "red"], [172, "green"], [196, "brand"], [220, "red"]].map(([x, c]) => (
        <circle key={x} cx={x as number} cy="152" r="7" className={c === "red" ? red : c === "green" ? green : brand} />
      ))}
      <rect x="276" y="20" width="104" height="150" rx="22" className={body} />
      <rect x="318" y="34" width="28" height="124" rx="14" className={soft} />
      {[["P", 52], ["R", 86], ["N", 120], ["D", 154]].map(([letter, y]) => (
        <g key={letter}>
          <circle cx="296" cy={y as number} r="11" className={letter === "P" || letter === "N" ? brand : panel} />
          <text x="296" y={(y as number) + 6} textAnchor="middle" fontSize="16" fontWeight="700" className="fill-foreground stroke-none">{letter}</text>
        </g>
      ))}
      <path d="M332 120 v-24" className={line} strokeWidth="5" /><circle cx="332" cy="92" r="10" className={ink} />
      <rect x="20" y="190" width="100" height="84" rx="18" className={body} />
      <rect x="34" y="244" width="72" height="20" rx="8" className={panel} />
      <path d="M52 244 L86 206" className={line} strokeWidth="6" /><circle cx="90" cy="202" r="8" className={brand} />
      <circle cx="150" cy="236" r="28" className={ink} /><circle cx="150" cy="236" r="19" className={red} />
      <path d="M150 226 v12" className="fill-none stroke-card" strokeWidth="4" /><path d="M142 232 a10 10 0 1 0 16 0" className="fill-none stroke-card" strokeWidth="3.5" />
      <rect x="206" y="206" width="34" height="60" rx="8" className={ink} />
      <path d="M196 270 L250 202" className="fill-none stroke-destructive" strokeWidth="6" />
      <rect x="282" y="196" width="98" height="78" rx="16" className={body} />
      {[[306, 220], [356, 220], [306, 252], [356, 252]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="11" className={brand} />)}
    </>
  );
}

const ART: Record<string, () => ReactNode> = {
  "rpk-exterior": Exterior,
  "rpk-engine": Engine,
  "rpk-boot": Boot,
  "rsm-position": Position,
  "rsm-mirrors": Mirrors,
  "rsm-controls": Controls,
};

/** The picture for a part, or nothing for an id that has none. */
export function PartArt({ topicId, label }: { topicId: string; label: string }) {
  const Art = ART[topicId];
  if (!Art) return null;
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={label} className="block h-auto w-full" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Art />
    </svg>
  );
}
