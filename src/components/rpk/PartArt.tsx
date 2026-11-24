/**
 * One flat illustration per RPK / RSM part, drawn in-house in one style, all of a Perodua Axia (the car at every
 * driving school; no badge, logo or lettering is drawn): 2 px rounded outlines, fills from the
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
  "rpk-exterior": [[274, 95], [274, 205], [312, 114], [262, 150], [190, 150], [118, 150], [200, 248]],
  "rpk-engine": [[106, 108], [77, 74], [80, 204], [130, 200], [320, 186], [284, 150], [110, 238], [324, 106]],
  "rpk-boot": [[56, 52], [140, 52], [224, 52], [308, 52], [56, 174], [140, 174], [224, 174], [308, 174]],
  "rsm-position": [[158, 178], [206, 226], [250, 90], [184, 152], [322, 166], [92, 111]],
  "rsm-mirrors": [[200, 55], [58, 60], [150, 162], [196, 236]],
  "rsm-controls": [[135, 152], [324, 96], [150, 236], [335, 236]],
};

/** Top view of an Axia, front to the right: short bonnet, swept-back headlamps, short tail, glass all round. */
function Exterior() {
  return (
    <>
      <rect x="44" y="70" width="312" height="160" rx="60" className={guide} strokeDasharray="6 8" />
      <polygon points="208,66 194,58 194,74" className="fill-foreground/30 stroke-none" />
      {[[100, 87], [100, 197], [254, 87], [254, 197]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="40" height="16" rx="5" className={ink} />)}
      <path d="M84 118 Q84 98 104 98 H292 Q326 98 326 124 V176 Q326 202 292 202 H104 Q84 202 84 182 Z" className={body} />
      <path d="M126 112 H238 L268 124 V176 L238 188 H126 Q116 188 116 176 V124 Q116 112 126 112 Z" className={panel} />
      <polygon points="240,113 270,126 270,174 240,187" className={glass} />
      <polygon points="126,113 116,126 116,174 126,187" className={glass} />
      <path d="M326 112 L300 106 L298 124 L326 130 Z M326 188 L300 194 L298 176 L326 170 Z" className={brand} />
      <path d="M326 150 H306" className={guide} strokeWidth="5" />
      <rect x="84" y="110" width="7" height="22" rx="3" className={red} />
      <rect x="84" y="168" width="7" height="22" rx="3" className={red} />
      <rect x="226" y="88" width="16" height="9" rx="3" className={body} />
      <rect x="226" y="203" width="16" height="9" rx="3" className={body} />
      <path d="M268 172 L248 132 M268 152 L250 120" className={line} strokeWidth="3.5" />
      {[170, 200, 230].map((x, i) => <path key={x} d={`M${x} ${236 + (i === 1 ? 10 : 0)} q-7 10 0 14 q7 -4 0 -14z`} className="fill-info stroke-foreground/40" />)}
    </>
  );
}

/**
 * The Axia's engine bay as you see it standing at the front with the bonnet up (right-hand drive): image left is
 * the driver's side. Brake-fluid bottle and yellow oil dipstick on the left, air-filter box over the three-cylinder
 * engine, fuse box and battery top right, yellow radiator cap and white coolant bottle low right, washer filler on
 * the right edge, the red radiator support bar with the latch along the front. Electric steering and a sealed CVT
 * have no fluid to check, so those two steps point at the steering motor and the gearbox housing.
 */
function Engine() {
  return (
    <>
      <rect x="30" y="30" width="340" height="240" rx="22" className={panel} />
      <circle cx="62" cy="76" r="22" className={soft} /><circle cx="338" cy="76" r="22" className={soft} />
      <rect x="64" y="52" width="26" height="42" rx="7" className={glass} /><path d="M68 78 h18" className={line} />
      <rect x="68" y="44" width="18" height="10" rx="3" className="fill-info stroke-foreground/50" />
      <path d="M150 74 C116 74 112 112 126 152" className="fill-none stroke-foreground/70" strokeWidth="14" />
      <rect x="150" y="44" width="122" height="58" rx="10" className={ink} />
      <rect x="140" y="112" width="132" height="102" rx="12" className={body} />
      <rect x="152" y="122" width="108" height="44" rx="9" className={soft} /><circle cx="206" cy="144" r="9" className={panel} /><circle cx="206" cy="144" r="4" className={brand} />
      <rect x="118" y="168" width="24" height="52" rx="6" className={ink} />
      <rect x="60" y="190" width="42" height="26" rx="6" className={ink} /><circle cx="81" cy="203" r="6" className={panel} />
      <path d="M106 124 v-12" className={line} strokeWidth="3" /><circle cx="106" cy="107" r="8" className="fill-none stroke-brand" strokeWidth="5" />
      <polygon points="272,128 296,142 296,196 272,206" className={line} strokeWidth="5" />
      {[[284, 140, 9], [284, 196, 9]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} className={soft} />)}
      <rect x="290" y="44" width="64" height="30" rx="6" className={ink} /><path d="M298 59 h48" className="fill-none stroke-card/60" />
      <rect x="292" y="86" width="64" height="40" rx="6" className={ink} />
      <rect x="298" y="78" width="16" height="9" rx="3" className={red} /><rect x="334" y="80" width="14" height="7" rx="2" className={soft} />
      <rect x="298" y="162" width="40" height="46" rx="8" className={glass} /><path d="M302 188 h32" className={line} /><rect x="308" y="156" width="20" height="8" rx="3" className="fill-foreground/50 stroke-foreground/40" />
      <rect x="348" y="132" width="16" height="48" rx="6" className={glass} /><circle cx="356" cy="130" r="7" className="fill-info stroke-foreground/50" />
      <rect x="60" y="224" width="280" height="30" rx="8" className={body} />
      <circle cx="110" cy="238" r="14" className={soft} />{[0, 90].map(a => <ellipse key={a} cx="110" cy="238" rx="13" ry="4" transform={`rotate(${a + 25} 110 238)`} className={ink} />)}
      <circle cx="262" cy="224" r="7" className={brand} />
      <path d="M284 224 C300 214 296 206 284 200" className="fill-none stroke-foreground/70" strokeWidth="6" />
      <rect x="36" y="258" width="328" height="10" rx="3" className={red} /><rect x="188" y="254" width="24" height="16" rx="4" className={ink} />
    </>
  );
}

function Tile({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width="78" height="104" rx="12" className={body} />
      <g transform={`translate(${x + 39} ${y + 58})`}>{children}</g>
    </g>
  );
}

function Boot() {
  return (
    <>
      <path d="M30 22 H370 L388 254 Q390 266 376 266 H24 Q10 266 12 254 Z" className={panel} />
      <rect x="16" y="270" width="368" height="18" rx="7" className={ink} />
      <rect x="2" y="40" width="10" height="38" rx="4" className={red} /><rect x="388" y="40" width="10" height="38" rx="4" className={red} />
      <Tile x={40} y={36}>
        <polygon points="0,-30 32,24 -32,24" className={red} />
        <polygon points="0,-12 15,12 -15,12" className={panel} />
      </Tile>
      <Tile x={124} y={36}>
        <rect x="-30" y="-20" width="60" height="44" rx="7" className={panel} />
        <path d="M-10 -20 v-8 h20 v8" className={line} />
        <rect x="-5" y="-10" width="10" height="24" className={red} /><rect x="-12" y="-3" width="24" height="10" className={red} />
      </Tile>
      <Tile x={208} y={36}>
        <rect x="-8" y="-20" width="16" height="48" rx="4" className={ink} />
        <rect x="-15" y="-32" width="30" height="14" rx="4" className={brand} />
        <path d="M-22 -40 l-8 -6 M0 -44 v-8 M22 -40 l8 -6" className={guide} />
      </Tile>
      <Tile x={292} y={36}>
        <rect x="-14" y="-8" width="28" height="42" rx="9" className={red} />
        <rect x="-6" y="-22" width="12" height="14" rx="3" className={ink} />
        <path d="M6 -20 q22 0 22 20 M-10 -26 h14" className={line} strokeWidth="3" />
      </Tile>
      <Tile x={40} y={158}>
        <polygon points="-26,14 0,-14 26,14 0,26" className={brand} />
        <path d="M-26 -32 l52 -4" className={line} strokeWidth="6" /><circle cx="-26" cy="-32" r="7" className={ink} />
      </Tile>
      <Tile x={124} y={158}>
        <path d="M-26 -22 q14 -14 28 0 t24 -2" className="fill-none stroke-destructive" strokeWidth="4" />
        <rect x="-30" y="-30" width="12" height="16" rx="3" className={ink} /><rect x="14" y="-30" width="12" height="16" rx="3" className={ink} />
        <circle cx="0" cy="14" r="20" className={soft} /><circle cx="0" cy="14" r="9" className={panel} />
      </Tile>
      <Tile x={208} y={158}>
        <path d="M-26 -26 l20 20 a9 9 0 1 0 12 -12 z" className={ink} />
        <path d="M24 -28 v50" className={line} strokeWidth="7" /><rect x="18" y="-34" width="12" height="14" rx="3" className={brand} />
        <path d="M-24 28 l30 -8" className={line} strokeWidth="5" />
      </Tile>
      <Tile x={292} y={158}>
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
      <path d="M44 248 V96 Q44 44 100 40 H214 L292 136 L372 150 V248" className={glass} />
      <path d="M44 248 V96 Q44 44 100 40 H214 L292 136" className="fill-none stroke-foreground/50" strokeWidth="4" />
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
      <circle cx="96" cy="88" r="52" className={panel} />
      <path d="M58 118 A44 44 0 1 1 134 118" className={guide} strokeDasharray="3 7" strokeWidth="4" />
      <path d="M96 88 L120 66" className={line} strokeWidth="4" /><circle cx="96" cy="88" r="6" className={ink} />
      <rect x="164" y="48" width="78" height="62" rx="9" className={ink} />
      <path d="M174 64 h40 M174 78 h58 M174 92 h30" className="fill-none stroke-brand" strokeWidth="4" />
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
      <circle cx="150" cy="236" r="28" className={ink} /><rect x="144" y="222" width="12" height="28" rx="5" className={panel} />
      <path d="M150 226 v20" className="fill-none stroke-foreground/60" strokeWidth="3" />
      <path d="M178 232 h24 q8 0 8 8 t-8 8 h-24z" className={brand} /><circle cx="198" cy="240" r="4" className={panel} />
      <rect x="226" y="206" width="34" height="60" rx="8" className={ink} />
      <path d="M216 270 L270 202" className="fill-none stroke-destructive" strokeWidth="6" />
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
