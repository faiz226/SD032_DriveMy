import type { Language } from "@/lib/constants";

type Text = Record<Language, string>;

export interface Topic {
  id: string;
  routine: "rpk" | "rsm";
  title: Text;
  /** What to do before the steps, when the part starts with getting at it. */
  intro?: Text;
  steps: Record<Language, string[]>;
}

/**
 * RPK (rutin pemeriksaan kenderaan) and RSM (rutin sebelum memandu), as the KPP class D and class DA textbooks
 * teach them for KPP02 circuit training: "Pemeriksaan Sebelum Memulakan Perjalanan" and "Menghidupkan Dan
 * Mematikan Enjin". RPK has three parts (outside, engine bay, boot); RSM is eight steps in a fixed order, split
 * here into three parts. The ids are saved progress rows: keep them.
 */
export const RPK_TOPICS: Topic[] = [
  {
    id: "rpk-exterior",
    routine: "rpk",
    title: { en: "Outside the car", ms: "Bahagian luar kenderaan" },
    intro: {
      en: "Walk round the car clockwise and look for damage.",
      ms: "Berjalan mengelilingi kenderaan mengikut arah jam dan perhatikan sebarang kerosakan.",
    },
    steps: {
      en: [
        "Tyres, including the spare: check the pressure with a gauge against the tyre table by the driver's door, and make sure no tyre is cracked, bulging or torn.",
        "Tread: change a tyre once it has worn down to its wear indicator.",
        "Lights: headlights, rear lights, indicators, brake lights, the third brake light and reversing lights all work, and every lens is clean and not cracked.",
        "Wiper blades: the rubber is not hard, cracked or torn.",
        "Body: number plates clean and undamaged, bumpers in good shape, boot and bonnet shut tight, side mirrors clean and undamaged, doors and windows open and close properly.",
        "Windscreen and rear window: clean and undamaged.",
        "Look under the car for any leaks.",
      ],
      ms: [
        "Tayar, termasuk tayar ganti: periksa tekanan angin dengan tolok pengukur berpandukan jadual tekanan angin di tepi pintu pemandu, dan pastikan tayar tidak merekah, menggelembung atau terkoyak.",
        "Bunga tayar: tukar tayar apabila sudah haus hingga ke penunjuk aras kehausan.",
        "Lampu: lampu hadapan, lampu belakang, lampu isyarat, lampu brek, lampu brek ketiga dan lampu undur menyala, dan semua cermin lampu bersih serta tidak retak.",
        "Bilah pengelap cermin: getahnya tidak keras, retak atau koyak.",
        "Badan kenderaan: plet nombor bersih dan tidak rosak, bamper dalam keadaan baik, but dan bonet tertutup rapat, cermin sisi bersih dan tidak rosak, pintu dan tingkap boleh dibuka dan ditutup dengan baik.",
        "Cermin hadapan dan belakang: bersih dan tidak rosak.",
        "Periksa bahagian bawah kenderaan untuk mengesan sebarang kebocoran.",
      ],
    },
  },
  {
    id: "rpk-engine",
    routine: "rpk",
    title: { en: "Engine bay", ms: "Ruang enjin" },
    intro: {
      en: "Open the bonnet with the lever under the right of the dashboard, release the safety catch and prop the bonnet up.",
      ms: "Buka bonet dengan tombol di bawah sebelah kanan papan pemuka, tolak pengunci keselamatan dan letakkan topang penahan bonet.",
    },
    steps: {
      en: [
        "Engine oil: pull out the dipstick. The level must be between minimum and maximum.",
        "Brake fluid: between minimum and maximum.",
        "Power steering fluid, if the car has it: between minimum and maximum.",
        "Gear oil: check the dipstick. The level must be between minimum and maximum.",
        "Water: radiator, reserve tank, battery (for a wet battery) and windscreen washer all have enough. Open the radiator cap only when the engine is cool.",
        "Belts: not cracked or frayed. Press each one with your thumb: it should give 0.5 to 1.0 cm.",
        "Fan blades: not damaged, and nothing stops them turning.",
        "Connections: wires firmly attached, hoses not leaking, cracked or swollen, and battery terminals clean and tight.",
      ],
      ms: [
        "Minyak enjin: tarik batang penyukat. Paras minyak mesti di antara minimum dan maksimum.",
        "Minyak brek: di antara paras minimum dan maksimum.",
        "Minyak stereng kuasa, jika ada: di antara paras minimum dan maksimum.",
        "Minyak gear: periksa batang penyukat. Paras minyak mesti di antara minimum dan maksimum.",
        "Air: radiator, tangki simpanan, air bateri (bagi bateri basah) dan air pencuci cermin mencukupi. Buka penutup radiator hanya apabila enjin sejuk.",
        "Tali sawat: tidak pecah atau berbulu. Tekan setiap tali sawat dengan ibu jari: kekendurannya mestilah 0.5 hingga 1.0 cm.",
        "Bilah kipas: tidak rosak dan tidak terhalang semasa berpusing.",
        "Sambungan: wayar tersambung dengan kemas, hos tidak bocor, merekah atau kembang, dan terminal bateri bersih serta diikat ketat.",
      ],
    },
  },
  {
    id: "rpk-boot",
    routine: "rpk",
    title: { en: "Boot", ms: "But kenderaan" },
    intro: {
      en: "Open the boot with the lever by the lower right side of the driver's seat, and check the emergency kit is there and works.",
      ms: "Buka but dengan tombol di bahagian bawah sebelah kanan tempat duduk pemandu, dan pastikan peralatan kecemasan ada dan boleh digunakan.",
    },
    steps: {
      en: [
        "Warning triangle.",
        "First-aid kit and guidebook.",
        "Torch.",
        "Dry-powder fire extinguisher.",
        "Jack and handle, and the wheel nut wrench.",
        "Jumper cables and a tow rope.",
        "Repair tools: adjustable spanner, screwdriver, spark plug spanner, assorted spanners and pliers.",
        "A container of clean water.",
      ],
      ms: [
        "Tanda amaran segi tiga.",
        "Kotak ubat dan buku panduan.",
        "Lampu suluh.",
        "Alat pemadam api jenis kering.",
        "Jek dan pemutar, serta pembuka nat roda.",
        "Kabel jumper dan tali untuk tunda.",
        "Peralatan pembaikan: sepana boleh laras, pemutar skru, sepana palam pencucuh, pelbagai jenis sepana dan playar.",
        "Satu bekas berisi air bersih.",
      ],
    },
  },
  {
    id: "rsm-position",
    routine: "rsm",
    title: { en: "Get in and sit right", ms: "Masuk dan duduk dengan betul" },
    steps: {
      en: [
        "Get in, sit down and make sure the handbrake is on.",
        "Sit back with both feet behind the brake and accelerator pedals, knees bent at about 120°.",
        "Slide the seat until your right arm reaches the top of the wheel (12 o'clock) straight, with your back still against the seat.",
        "Hold the wheel at 3 and 9 or at 2 and 10 o'clock, so your elbows bend at about 120°.",
        "Make sure you can reach every switch and the gear lever, and nothing blocks your view. Never adjust the seat while driving.",
        "Set the head restraint level with your ears, close behind your head.",
      ],
      ms: [
        "Masuk, duduk dan pastikan brek tangan ditarik.",
        "Duduk bersandar dengan kedua-dua kaki di belakang pedal brek dan pemecut, dan lutut dibengkokkan kira-kira 120°.",
        "Laraskan tempat duduk sehingga tangan kanan lurus mencapai bahagian atas stereng (kedudukan jam 12) dengan badan masih bersandar.",
        "Pegang stereng pada kedudukan jam 3 dan 9 atau 2 dan 10, supaya siku bersudut kira-kira 120°.",
        "Pastikan semua suis dan tombol gear boleh dicapai dan penglihatan tidak terhalang. Jangan laraskan tempat duduk semasa memandu.",
        "Laraskan penyandar kepala selari dengan telinga dan rapat di belakang kepala.",
      ],
    },
  },
  {
    id: "rsm-mirrors",
    routine: "rsm",
    title: { en: "Mirrors and seat belt", ms: "Cermin dan tali pinggang keledar" },
    steps: {
      en: [
        "Rear-view mirror: set it so you see the whole rear window.",
        "Side mirrors: set each one so a quarter of it shows your car and three quarters shows the road beside and behind you.",
        "Seat belt: pull it gently from your shoulder towards the buckle.",
        "Push the tongue into the buckle until it clicks, and keep the belt as low as possible across your waist.",
      ],
      ms: [
        "Cermin pandang belakang: laraskan supaya dapat melihat keseluruhan cermin belakang kenderaan.",
        "Cermin sisi: laraskan supaya 25% cermin menunjukkan badan kenderaan dan 75% menunjukkan bahagian sisi belakang.",
        "Tali pinggang keledar: tarik dari bahagian bahu dengan lembut ke arah pengancing.",
        "Selitkan plet ke dalam pengancing sehingga berbunyi klik, dan letakkan tali pinggang serendah mungkin pada pinggang.",
      ],
    },
  },
  {
    id: "rsm-controls",
    routine: "rsm",
    title: { en: "Instruments, gear and engine", ms: "Instrumen, gear dan enjin" },
    steps: {
      en: [
        "Check that every indicator on the instrument panel works.",
        "Make sure the gear lever is in neutral (N), or in P in an automatic.",
        "Start the engine without pressing the accelerator.",
        "Check that the switches for the car's equipment work.",
      ],
      ms: [
        "Pastikan semua penunjuk pada panel instrumen berfungsi dengan baik.",
        "Pastikan tombol gear pada kedudukan bebas (N), atau P bagi kereta automatik.",
        "Hidupkan enjin tanpa memijak pemecut.",
        "Pastikan suis peralatan berfungsi dengan baik.",
      ],
    },
  },
];

export function countRpkCompleted(rows: { module_id: string; completed: boolean }[]) {
  const ids = new Set(rows.filter(row => row.completed).map(row => row.module_id));
  return RPK_TOPICS.filter(topic => ids.has(topic.id)).length;
}
