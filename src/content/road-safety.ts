import type { Language } from "@/lib/constants";

type Text = Record<Language, string>;

export interface Emergency {
  id: string;
  situation: Text;
  /** The first option is the KPP answer; the page shuffles them. */
  options: [Text, Text, Text];
  /** What the KPP textbooks say to do, in order. */
  steps: Record<Language, string[]>;
}

/**
 * Emergencies from the KPP textbooks' "driving in different conditions" chapter (Pemanduan Dalam Pelbagai
 * Keadaan: Pemanduan Semasa Kecemasan, Lebuh Raya, Cuaca). Every step is in the 2021 class D and DA books and
 * agrees with the 2025 combined KPP book. Where those editions differ (how far back the warning triangle goes,
 * what to do after a windscreen breaks, how a skid is described) the drill leaves the point out rather than pick
 * one edition.
 */
export const EMERGENCIES: Emergency[] = [
  {
    id: "brakes",
    situation: {
      en: "You press the brake and the pedal sinks to the floor.",
      ms: "Anda menekan brek dan pedalnya tenggelam hingga ke lantai.",
    },
    options: [
      {
        en: "Pump the brake pedal a few times. If that fails, pull the handbrake up gradually and change to a lower gear.",
        ms: "Pam pedal brek beberapa kali. Jika gagal, tarik brek tangan secara beransur-ansur dan tukar ke gear rendah.",
      },
      { en: "Pull the handbrake up hard, all at once.", ms: "Tarik brek tangan sekuat-kuatnya sekali gus." },
      { en: "Switch off the engine straight away.", ms: "Matikan enjin dengan segera." },
    ],
    steps: {
      en: [
        "Pump the brake pedal a few times. This may bring the brake pressure back.",
        "If it does not and the road is safe, pull the handbrake up gradually to slow down.",
        "Change down to a lower gear so the engine helps slow the car.",
        "Find a suitable, safe place to stop.",
      ],
      ms: [
        "Pam pedal brek beberapa kali. Ini mungkin dapat memulihkan tekanan brek.",
        "Jika tidak berjaya dan jalan selamat, tarik brek tangan secara beransur-ansur untuk memperlahankan kenderaan.",
        "Tukar ke gear rendah supaya enjin membantu memperlahankan kenderaan.",
        "Cari tempat yang sesuai dan selamat untuk berhenti.",
      ],
    },
  },
  {
    id: "accelerator",
    situation: {
      en: "The accelerator pedal is stuck down.",
      ms: "Pedal pemecut terlekat.",
    },
    options: [
      {
        en: "Slow down with the foot brake, find a place to stop, then apply the handbrake, select neutral and switch off the engine.",
        ms: "Perlahankan kenderaan dengan brek kaki, cari tempat untuk berhenti, kemudian tarik brek tangan, bebaskan gear dan matikan enjin.",
      },
      { en: "Reach down and pull the pedal up with your hand while you drive.", ms: "Tunduk dan tarik pedal ke atas dengan tangan semasa memandu." },
      { en: "Keep driving and wait for the pedal to free itself.", ms: "Teruskan memandu dan tunggu pedal bebas dengan sendiri." },
    ],
    steps: {
      en: [
        "Slow the car down with the foot brake, in a controlled way.",
        "Find a suitable place to stop.",
        "Apply the handbrake to stop the car, put the gear in neutral and switch off the engine.",
      ],
      ms: [
        "Perlahankan kenderaan dengan brek kaki secara terkawal.",
        "Cari tempat yang sesuai untuk berhenti.",
        "Tarik brek tangan untuk memberhentikan kenderaan, bebaskan gear dan matikan enjin.",
      ],
    },
  },
  {
    id: "tyre",
    situation: {
      en: "A tyre bursts while you are driving.",
      ms: "Tayar pecah semasa anda memandu.",
    },
    options: [
      {
        en: "Hold the steering wheel firmly, brake gently and stop somewhere safe and level.",
        ms: "Pegang stereng dengan kemas, brek perlahan-lahan dan berhenti di tempat yang rata dan selamat.",
      },
      { en: "Brake hard to stop as quickly as you can.", ms: "Brek dengan kuat supaya berhenti secepat mungkin." },
      { en: "Keep going at the same speed to the next exit.", ms: "Teruskan pada kelajuan yang sama hingga ke susur keluar seterusnya." },
    ],
    steps: {
      en: [
        "Hold the steering wheel firmly to keep the car stable.",
        "Control the car carefully and brake gently.",
        "Find a safe, level place to change the tyre.",
      ],
      ms: [
        "Pegang stereng dengan kemas untuk menstabilkan kenderaan.",
        "Kawal kenderaan dengan berhati-hati dan brek perlahan-lahan.",
        "Cari kawasan yang rata dan selamat untuk menukar tayar.",
      ],
    },
  },
  {
    id: "headlights",
    situation: {
      en: "Your headlights go out while you are driving at night.",
      ms: "Lampu hadapan terpadam semasa anda memandu pada waktu malam.",
    },
    options: [
      {
        en: "Slow down, follow the white lines or other vehicles' lights, switch on the hazard lights and stop somewhere safe.",
        ms: "Perlahankan kenderaan, ikut garisan putih atau cahaya kenderaan lain, nyalakan lampu kecemasan dan berhenti di tempat yang selamat.",
      },
      { en: "Speed up to reach a lit stretch of road sooner.", ms: "Pecut supaya lebih cepat sampai ke jalan yang berlampu." },
      { en: "Stop at once, right where you are in your lane.", ms: "Berhenti serta-merta di lorong anda." },
    ],
    steps: {
      en: [
        "Slow down and keep the car under control.",
        "Guide yourself by the light of other vehicles or by the white lines on the road.",
        "Switch on your hazard lights.",
        "Stop somewhere safe.",
      ],
      ms: [
        "Perlahankan dan kawal kenderaan.",
        "Gunakan cahaya kenderaan lain atau ikut garisan putih di atas jalan sebagai panduan.",
        "Nyalakan lampu isyarat kecemasan.",
        "Berhenti di kawasan yang selamat.",
      ],
    },
  },
  {
    id: "fire",
    situation: {
      en: "Your car catches fire while you are driving.",
      ms: "Kenderaan anda terbakar semasa anda memandu.",
    },
    options: [
      {
        en: "Stop at once, switch off the engine and get everyone out.",
        ms: "Berhenti dengan segera, matikan enjin dan keluarkan semua penumpang.",
      },
      { en: "Keep driving to the nearest workshop.", ms: "Teruskan memandu ke bengkel yang terdekat." },
      { en: "Stay inside the car and phone for help.", ms: "Tunggu di dalam kenderaan dan telefon untuk meminta bantuan." },
    ],
    steps: {
      en: [
        "Stop the car at once, on the road shoulder, and switch off the engine.",
        "Get all your passengers out of the car.",
        "Put the fire out with a fire extinguisher, or get help from other road users.",
        "If you cannot control the fire, leave the car and call the fire brigade (bomba).",
      ],
      ms: [
        "Berhentikan kenderaan dengan segera di bahu jalan dan matikan enjin.",
        "Keluarkan semua penumpang dari kenderaan.",
        "Padamkan api dengan alat pemadam api, atau dapatkan bantuan pengguna jalan raya yang lain.",
        "Jika api tidak dapat dikawal, tinggalkan kenderaan dan hubungi pihak bomba.",
      ],
    },
  },
  {
    id: "breakdown",
    situation: {
      en: "Your car breaks down on the highway.",
      ms: "Kenderaan anda rosak di lebuh raya.",
    },
    options: [
      {
        en: "Signal left, stop in the emergency lane, switch on the hazard lights and put the warning triangle behind the car.",
        ms: "Beri isyarat ke kiri, berhenti di lorong kecemasan, nyalakan lampu kecemasan dan letakkan tanda amaran segi tiga di belakang kenderaan.",
      },
      { en: "Stop in the left lane, where it broke down, and fix it there.", ms: "Berhenti di lorong kiri, tempat kenderaan rosak, dan baiki di situ." },
      { en: "Stand behind the car and wave the traffic past.", ms: "Berdiri di belakang kenderaan dan lambai kenderaan lain supaya melintas." },
    ],
    steps: {
      en: [
        "Slow down, signal left and stop in the emergency lane.",
        "Switch on the hazard lights. At night, switch on the interior light too.",
        "Put the warning triangle behind the car.",
        "Keep your passengers away from the traffic, and do not stand behind the car where you hide its rear lights.",
      ],
      ms: [
        "Pandu perlahan, beri isyarat ke kiri dan berhenti di lorong kecemasan.",
        "Nyalakan lampu kecemasan. Pada waktu malam, nyalakan juga lampu dalam kenderaan.",
        "Letakkan tanda amaran segi tiga di belakang kenderaan.",
        "Jauhkan penumpang daripada aliran lalu lintas, dan jangan berdiri di belakang kenderaan sehingga lampu belakangnya terlindung.",
      ],
    },
  },
  {
    id: "flood",
    situation: {
      en: "The road ahead is flooded.",
      ms: "Jalan di hadapan ditenggelami banjir.",
    },
    options: [
      {
        en: "Stop and judge how deep the water is. If it is too deep, turn back and use another route.",
        ms: "Berhenti dan nilai kedalaman air. Jika terlalu dalam, patah balik dan gunakan laluan lain.",
      },
      { en: "Drive through fast so the car does not get stuck.", ms: "Redah dengan laju supaya kenderaan tidak tersangkut." },
      { en: "Follow the car in front through the water.", ms: "Ikut kenderaan di hadapan meredah air." },
    ],
    steps: {
      en: [
        "Do not rush. Stop and judge how deep the water is.",
        "If it is too deep, turn back and use another route, even a longer one.",
        "If it is shallow enough to cross, drive slowly in a low gear on the highest part of the road, and watch for hidden drains.",
      ],
      ms: [
        "Jangan tergesa-gesa. Berhenti dan nilai kedalaman air.",
        "Jika air terlalu dalam, patah balik dan gunakan laluan alternatif walaupun lebih jauh.",
        "Jika air cukup cetek untuk dilalui, pandu perlahan dengan gear rendah di bahagian jalan yang paling tinggi, dan berhati-hati dengan longkang atau parit yang tidak kelihatan.",
      ],
    },
  },
  {
    id: "drowsy",
    situation: {
      en: "You start to feel sleepy on a long highway drive.",
      ms: "Anda mula mengantuk semasa memandu jauh di lebuh raya.",
    },
    options: [
      {
        en: "Stop at a rest area and rest before you carry on.",
        ms: "Berhenti di kawasan rehat dan berehat sebelum meneruskan perjalanan.",
      },
      { en: "Open the windows and turn the radio up.", ms: "Buka tingkap dan kuatkan radio." },
      { en: "Drive faster so you get home sooner.", ms: "Pandu lebih laju supaya cepat sampai ke rumah." },
    ],
    steps: {
      en: [
        "Stop and rest at a proper rest area when you feel sleepy.",
        "On the highway, stop to rest after two hours of driving.",
        "If you are sleepy at night, the safe thing to do is stop for a while and sleep.",
      ],
      ms: [
        "Berhenti dan berehat di tempat rehat yang disediakan apabila mengantuk.",
        "Di lebuh raya, berhenti berehat selepas dua jam memandu.",
        "Jika mengantuk pada waktu malam, langkah yang selamat ialah berhenti seketika untuk tidur.",
      ],
    },
  },
];
