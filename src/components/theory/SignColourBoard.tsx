import type { RoadSignCategory } from "@/content/theory";

type Lang = "en" | "bm";
type Source = "Wikipedia" | "Kurnia";

interface Fact {
  en: string;
  ms: string;
  source: Source;
  fun?: boolean;
}

// Every line here is stated on one of the two pages named in `source`:
//   Wikipedia: https://en.wikipedia.org/wiki/Road_signs_in_Malaysia
//   Kurnia:    https://www.kurnia.com/blog/road-signs-malaysia-what-they-mean
// (see reports/deployment-audit/evidence-report4/sources.md for where each one is found).
const FACTS: Record<RoadSignCategory, Fact[]> = {
  warning: [
    { en: "Warning signs are diamond-shaped.", ms: "Papan tanda amaran berbentuk berlian.", source: "Wikipedia" },
    { en: "Fun fact: signs use Malay, but English is also used at public places like airports, railway stations and tourist attractions.", ms: "Fakta menarik: papan tanda menggunakan bahasa Melayu, tetapi bahasa Inggeris turut digunakan di tempat awam seperti lapangan terbang, stesen kereta api dan tarikan pelancong.", source: "Wikipedia", fun: true },
  ],
  prohibitory: [
    { en: "Regulatory signs use a red, white and black colour scheme. Ignore one and you may be penalised.", ms: "Tanda peraturan menggunakan warna merah, putih dan hitam. Jika diabaikan, anda boleh dikenakan tindakan.", source: "Kurnia" },
    { en: "Fun fact: No stopping has two slashes, No parking has one. You may stop briefly at No parking, never at No stopping.", ms: "Fakta menarik: Dilarang berhenti ada dua palang, Dilarang letak kenderaan ada satu. Anda boleh berhenti seketika di tanda dilarang letak, tetapi tidak di tanda dilarang berhenti.", source: "Kurnia", fun: true },
  ],
  mandatory: [
    { en: "Mandatory signs are round, with a blue background and a white picture. They tell you what you must do.", ms: "Tanda wajib berbentuk bulat, berlatar biru dengan gambar putih. Ia memberitahu apa yang mesti anda lakukan.", source: "Kurnia" },
    { en: "Fun fact: blue round signs also mark lanes for a certain type of vehicle, such as the motorcycle lane.", ms: "Fakta menarik: tanda bulat biru juga menandakan lorong untuk jenis kenderaan tertentu, seperti lorong motosikal.", source: "Wikipedia", fun: true },
  ],
  informational: [
    { en: "Information signs are blue.", ms: "Papan tanda maklumat berwarna biru.", source: "Wikipedia" },
    { en: "Blue signs are for federal, state and municipal roads. Green signs are for toll expressways only.", ms: "Papan tanda biru digunakan untuk jalan persekutuan, negeri dan perbandaran. Papan tanda hijau hanya untuk lebuh raya bertol.", source: "Wikipedia" },
    { en: "Fun fact: the Rest and Service Area sign is green on toll expressways and blue on roads without toll.", ms: "Fakta menarik: papan tanda Kawasan Rehat dan Rawat berwarna hijau di lebuh raya bertol dan biru di jalan tanpa tol.", source: "Wikipedia", fun: true },
  ],
  temporary: [
    { en: "Work zone signs are orange and black: a diamond on a rectangular board.", ms: "Papan tanda zon kerja berwarna jingga dan hitam: berlian pada papan segi empat tepat.", source: "Wikipedia" },
    { en: "Fun fact: the same pictures come with a distance, like “200 m” on the works-ahead and flagman signs.", ms: "Fakta menarik: gambar yang sama datang dengan jarak, seperti “200 m” pada tanda kerja di hadapan dan pengawal bendera.", source: "Wikipedia", fun: true },
  ],
};

function Swatch({ category }: { category: RoadSignCategory }) {
  const common = { strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-20 w-20 shrink-0">
      {category === "warning" && <path d="M50 8 L92 50 L50 92 L8 50 Z" fill="#F6C21A" stroke="#111" strokeWidth="6" {...common} />}
      {category === "prohibitory" && <circle cx="50" cy="50" r="38" fill="#fff" stroke="#D81E1E" strokeWidth="12" />}
      {category === "mandatory" && (
        <g>
          <circle cx="50" cy="50" r="40" fill="#0A5FBF" />
          <path d="M30 56 L50 30 L70 56 M50 34 V72" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {category === "informational" && (
        <g>
          <rect x="6" y="14" width="88" height="34" rx="5" fill="#0A5FBF" />
          <rect x="6" y="54" width="88" height="34" rx="5" fill="#0B7A3E" />
        </g>
      )}
      {category === "temporary" && (
        <g>
          <rect x="8" y="8" width="84" height="84" rx="8" fill="#F28C28" stroke="#111" strokeWidth="6" />
          <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="#F28C28" stroke="#111" strokeWidth="5" {...common} />
        </g>
      )}
    </svg>
  );
}

/** One short card for a category: what its colour and shape mean, and a fun fact. */
export function SignColourBoard({ category, lang }: { category: RoadSignCategory; lang: Lang }) {
  const facts = FACTS[category];
  return (
    <aside className="panel flex items-start gap-4 p-4 sm:p-5" aria-label={lang === "en" ? "What the colour and shape mean" : "Maksud warna dan bentuk"}>
      <Swatch category={category} />
      <ul className="min-w-0 space-y-1.5 text-sm leading-snug">
        {facts.map((fact) => (
          <li key={fact.en} className={fact.fun ? "text-muted-foreground" : "font-semibold text-foreground"}>
            {lang === "en" ? fact.en : fact.ms}
            <span className="ml-1.5 whitespace-nowrap text-[0.8125rem] font-normal text-muted-foreground">({fact.source})</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
