// Official JPJ KPP01 Curriculum Learning Content (General, Class DA, Class D)

export type RoadSignCategory =
  | "warning"
  | "prohibitory"
  | "mandatory"
  | "informational"
  | "temporary";

export interface RoadSignItem {
  id: string;
  type: RoadSignCategory;
  name: string;
  nameMs: string;
  desc: string;
  descMs: string;
  meaning: string;
  meaningMs: string;
  action: string;
  actionMs: string;
  source: string;
  img: string;
}

export interface TheoryTopicItem {
  id: string;
  title: string;
  titleMs: string;
  source: string;
  badge: string;
  content: string;
  contentMs: string;
}

export const ROAD_SIGN_CATEGORIES: {
  id: RoadSignCategory;
  labelEn: string;
  labelMs: string;
  bookSectionEn: string;
  bookSectionMs: string;
  shapeEn: string;
  shapeMs: string;
  colorRuleEn: string;
  colorRuleMs: string;
  swatchClass: string;
}[] = [
  {
    id: "warning",
    labelEn: "Warning signs",
    labelMs: "Isyarat bahaya (Amaran)",
    bookSectionEn: "Part I · Warning Signs",
    bookSectionMs: "Bahagian I · Papan Tanda Amaran",
    shapeEn: "Often diamond-shaped",
    shapeMs: "Lazimnya berbentuk berlian",
    colorRuleEn: "Commonly yellow with a dark symbol",
    colorRuleMs: "Lazimnya kuning dengan simbol gelap",
    swatchClass: "bg-brand text-brand-foreground border-foreground",
  },
  {
    id: "prohibitory",
    labelEn: "Prohibitory signs",
    labelMs: "Isyarat larangan",
    bookSectionEn: "Part II · Prohibitory Signs",
    bookSectionMs: "Bahagian II · Papan Tanda Larangan",
    shapeEn: "Circle, Octagon (Stop), or Inverted Triangle (Give Way)",
    shapeMs: "Bulat, Oktagon (Berhenti), atau Segi Tiga Terbalik (Beri Laluan)",
    colorRuleEn: "White background with red border and black symbol (or red disc)",
    colorRuleMs: "Latar putih dengan sempadan merah dan simbol hitam (atau bulat merah)",
    swatchClass: "bg-destructive text-destructive-foreground border-destructive",
  },
  {
    id: "mandatory",
    labelEn: "Mandatory signs",
    labelMs: "Isyarat mandatori (Wajib)",
    bookSectionEn: "Part III · Mandatory Signs",
    bookSectionMs: "Bahagian III · Papan Tanda Wajib",
    shapeEn: "Circles and rectangular signs",
    shapeMs: "Bulatan dan segi empat tepat",
    colorRuleEn: "Blue background with white directional arrow or symbol",
    colorRuleMs: "Latar biru dengan anak panah atau simbol putih",
    swatchClass: "bg-info text-info-foreground border-info",
  },
  {
    id: "informational",
    labelEn: "Informational signs",
    labelMs: "Isyarat berinformasi (Maklumat)",
    bookSectionEn: "Part IV · Informational Signs",
    bookSectionMs: "Bahagian IV · Papan Tanda Maklumat",
    shapeEn: "Rectangle or Square",
    shapeMs: "Segi empat tepat atau sama",
    colorRuleEn: "Often blue with a light symbol or lettering",
    colorRuleMs: "Lazimnya biru dengan simbol atau tulisan cerah",
    swatchClass: "bg-success text-success-foreground border-success",
  },
  {
    id: "temporary",
    labelEn: "Temporary signs",
    labelMs: "Isyarat sementara (Zon kerja)",
    bookSectionEn: "Part V · Temporary Work Zone Signs",
    bookSectionMs: "Bahagian V · Papan Tanda Sementara Zon Kerja",
    shapeEn: "Diamond or Rectangle",
    shapeMs: "Berlian atau Segi Empat Tepat",
    colorRuleEn: "Often orange for roadworks",
    colorRuleMs: "Lazimnya jingga untuk kerja jalan",
    swatchClass: "bg-warning text-warning-foreground border-warning",
  },
];

export const roadSigns: RoadSignItem[] = [
  {
    "id": "warn-crossroads",
    "type": "warning",
    "name": "Four-way intersection",
    "nameMs": "Persimpangan empat hala",
    "desc": "Four-way intersection. Look for vehicles approaching from both sides before proceeding.",
    "descMs": "Persimpangan empat hala. Perhatikan kenderaan yang datang dari kedua-dua sisi sebelum meneruskan perjalanan.",
    "meaning": "Four-way intersection",
    "meaningMs": "Persimpangan empat hala",
    "action": "Look for vehicles approaching from both sides before proceeding.",
    "actionMs": "Perhatikan kenderaan yang datang dari kedua-dua sisi sebelum meneruskan perjalanan.",
    "source": "KPP General PDF page 40",
    "img": "/signs/4a3491aff2749365.svg"
  },
  {
    "id": "warn-side-road-left",
    "type": "warning",
    "name": "Side road to the left",
    "nameMs": "Simpang jalan di sebelah kiri",
    "desc": "Side road to the left. Watch for traffic coming out of the side road.",
    "descMs": "Simpang jalan di sebelah kiri. Awasi kenderaan yang keluar dari simpang.",
    "meaning": "Side road to the left",
    "meaningMs": "Simpang jalan di sebelah kiri",
    "action": "Watch for traffic coming out of the side road.",
    "actionMs": "Awasi kenderaan yang keluar dari simpang.",
    "source": "KPP General PDF page 42",
    "img": "/signs/e22292f492beec26.svg"
  },
  {
    "id": "warn-side-road-right",
    "type": "warning",
    "name": "Side road to the right",
    "nameMs": "Simpang jalan di sebelah kanan",
    "desc": "Side road to the right. Watch for traffic coming out of the side road.",
    "descMs": "Simpang jalan di sebelah kanan. Awasi kenderaan yang keluar dari simpang.",
    "meaning": "Side road to the right",
    "meaningMs": "Simpang jalan di sebelah kanan",
    "action": "Watch for traffic coming out of the side road.",
    "actionMs": "Awasi kenderaan yang keluar dari simpang.",
    "source": "KPP General PDF page 42",
    "img": "/signs/12e8b0d727c5bdf1.svg"
  },
  {
    "id": "warn-t-junction",
    "type": "warning",
    "name": "T-junction ahead",
    "nameMs": "Persimpangan T di hadapan",
    "desc": "T-junction ahead. Slow down, signal your turn and stop at the junction before proceeding safely.",
    "descMs": "Persimpangan T di hadapan. Perlahankan kenderaan, beri isyarat membelok dan berhenti di persimpangan sebelum meneruskan perjalanan dengan selamat.",
    "meaning": "T-junction ahead",
    "meaningMs": "Persimpangan T di hadapan",
    "action": "Slow down, signal your turn and stop at the junction before proceeding safely.",
    "actionMs": "Perlahankan kenderaan, beri isyarat membelok dan berhenti di persimpangan sebelum meneruskan perjalanan dengan selamat.",
    "source": "KPP General PDF page 42",
    "img": "/signs/e3ccd470b3c6bc8e.svg"
  },
  {
    "id": "warn-double-arrow-split",
    "type": "warning",
    "name": "Pass either side of the island",
    "nameMs": "Lalui pulau dari mana-mana sisi",
    "desc": "Pass either side of the island. Choose a lane that leads where you intend to go and keep within it.",
    "descMs": "Lalui pulau dari mana-mana sisi. Pilih lorong yang menuju ke arah destinasi dan kekal dalam lorong itu.",
    "meaning": "Pass either side of the island",
    "meaningMs": "Lalui pulau dari mana-mana sisi",
    "action": "Choose a lane that leads where you intend to go and keep within it.",
    "actionMs": "Pilih lorong yang menuju ke arah destinasi dan kekal dalam lorong itu.",
    "source": "KPP General PDF page 44",
    "img": "/signs/322e269754adeff6.svg"
  },
  {
    "id": "warn-curve-left",
    "type": "warning",
    "name": "Sharp left bend",
    "nameMs": "Selekoh tajam ke kiri",
    "desc": "Sharp left bend. Adjust your speed and watch for the hazard.",
    "descMs": "Selekoh tajam ke kiri. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Sharp left bend",
    "meaningMs": "Selekoh tajam ke kiri",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 47",
    "img": "/signs/194637442da016e5.svg"
  },
  {
    "id": "warn-curve-right",
    "type": "warning",
    "name": "Sharp right bend",
    "nameMs": "Selekoh tajam ke kanan",
    "desc": "Sharp right bend. Adjust your speed and watch for the hazard.",
    "descMs": "Selekoh tajam ke kanan. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Sharp right bend",
    "meaningMs": "Selekoh tajam ke kanan",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 47",
    "img": "/signs/8c4124b32afd3704.svg"
  },
  {
    "id": "warn-chevron-curve",
    "type": "warning",
    "name": "Direction of a sharp bend",
    "nameMs": "Arah selekoh yang tajam",
    "desc": "Direction of a sharp bend. Adjust your speed and watch for the hazard.",
    "descMs": "Arah selekoh yang tajam. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Direction of a sharp bend",
    "meaningMs": "Arah selekoh yang tajam",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 47",
    "img": "/signs/b716cb9e685088a5.svg"
  },
  {
    "id": "warn-dual-carriageway-ends",
    "type": "warning",
    "name": "Divided road ends",
    "nameMs": "Jalan terbahagi dua tamat",
    "desc": "Divided road ends. Watch for vehicles coming the other way once the divider ends.",
    "descMs": "Jalan terbahagi dua tamat. Awasi kenderaan dari arah bertentangan selepas pembahagi jalan tamat.",
    "meaning": "Divided road ends",
    "meaningMs": "Jalan terbahagi dua tamat",
    "action": "Watch for vehicles coming the other way once the divider ends.",
    "actionMs": "Awasi kenderaan dari arah bertentangan selepas pembahagi jalan tamat.",
    "source": "KPP General PDF page 48",
    "img": "/signs/b12139221efc15b6.svg"
  },
  {
    "id": "warn-divided-highway-ahead",
    "type": "warning",
    "name": "Divided road begins",
    "nameMs": "Jalan terbahagi dua bermula",
    "desc": "Divided road begins. Stay on the correct side as the divider separates the two streams of traffic.",
    "descMs": "Jalan terbahagi dua bermula. Kekal di sebelah yang betul apabila pembahagi jalan memisahkan dua aliran trafik.",
    "meaning": "Divided road begins",
    "meaningMs": "Jalan terbahagi dua bermula",
    "action": "Stay on the correct side as the divider separates the two streams of traffic.",
    "actionMs": "Kekal di sebelah yang betul apabila pembahagi jalan memisahkan dua aliran trafik.",
    "source": "KPP General PDF page 48",
    "img": "/signs/788d475c2d05336c.svg"
  },
  {
    "id": "warn-roundabout-ahead",
    "type": "warning",
    "name": "Roundabout ahead",
    "nameMs": "Bulatan di hadapan",
    "desc": "Roundabout ahead. Pick the appropriate approach lane and yield to traffic already in the roundabout.",
    "descMs": "Bulatan di hadapan. Pilih lorong masuk yang sesuai dan beri laluan kepada kenderaan yang sudah berada dalam bulatan.",
    "meaning": "Roundabout ahead",
    "meaningMs": "Bulatan di hadapan",
    "action": "Pick the appropriate approach lane and yield to traffic already in the roundabout.",
    "actionMs": "Pilih lorong masuk yang sesuai dan beri laluan kepada kenderaan yang sudah berada dalam bulatan.",
    "source": "KPP General PDF page 48",
    "img": "/signs/d26a8ccc75c5a905.svg"
  },
  {
    "id": "warn-two-way-traffic",
    "type": "warning",
    "name": "Two-way traffic ahead",
    "nameMs": "Lalu lintas dua hala di hadapan",
    "desc": "Two-way traffic ahead. Expect oncoming vehicles on the same road and check carefully before overtaking.",
    "descMs": "Lalu lintas dua hala di hadapan. Jangkakan kenderaan dari arah bertentangan di jalan yang sama dan periksa keadaan sebelum memotong.",
    "meaning": "Two-way traffic ahead",
    "meaningMs": "Lalu lintas dua hala di hadapan",
    "action": "Expect oncoming vehicles on the same road and check carefully before overtaking.",
    "actionMs": "Jangkakan kenderaan dari arah bertentangan di jalan yang sama dan periksa keadaan sebelum memotong.",
    "source": "KPP General PDF page 49",
    "img": "/signs/ea082fc0b4c65733.svg"
  },
  {
    "id": "warn-road-narrows-both",
    "type": "warning",
    "name": "Road narrows on both sides",
    "nameMs": "Jalan menyempit di kedua-dua sisi",
    "desc": "Road narrows on both sides. Adjust your speed and watch for the hazard.",
    "descMs": "Jalan menyempit di kedua-dua sisi. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Road narrows on both sides",
    "meaningMs": "Jalan menyempit di kedua-dua sisi",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 50",
    "img": "/signs/ce68f8896451a2c9.svg"
  },
  {
    "id": "warn-road-narrows-left",
    "type": "warning",
    "name": "Road narrows on the left",
    "nameMs": "Jalan menyempit di sebelah kiri",
    "desc": "Road narrows on the left. Adjust your speed and watch for the hazard.",
    "descMs": "Jalan menyempit di sebelah kiri. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Road narrows on the left",
    "meaningMs": "Jalan menyempit di sebelah kiri",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 50",
    "img": "/signs/2be93e13645351ef.svg"
  },
  {
    "id": "warn-road-narrows-right",
    "type": "warning",
    "name": "Road narrows on the right",
    "nameMs": "Jalan menyempit di sebelah kanan",
    "desc": "Road narrows on the right. Adjust your speed and watch for the hazard.",
    "descMs": "Jalan menyempit di sebelah kanan. Laraskan kelajuan dan awasi bahaya.",
    "meaning": "Road narrows on the right",
    "meaningMs": "Jalan menyempit di sebelah kanan",
    "action": "Adjust your speed and watch for the hazard.",
    "actionMs": "Laraskan kelajuan dan awasi bahaya.",
    "source": "KPP General PDF page 50",
    "img": "/signs/e08ca85fb4d9816f.svg"
  },
  {
    "id": "warn-steep-ascent",
    "type": "warning",
    "name": "Steep uphill stretch",
    "nameMs": "Jalan mendaki dengan curam",
    "desc": "Steep uphill stretch. Select a lower gear to get the power needed to climb.",
    "descMs": "Jalan mendaki dengan curam. Gunakan gear rendah untuk mendapatkan kuasa yang diperlukan semasa mendaki.",
    "meaning": "Steep uphill stretch",
    "meaningMs": "Jalan mendaki dengan curam",
    "action": "Select a lower gear to get the power needed to climb.",
    "actionMs": "Gunakan gear rendah untuk mendapatkan kuasa yang diperlukan semasa mendaki.",
    "source": "KPP General PDF page 50",
    "img": "/signs/fa01479a3e275ae3.svg"
  },
  {
    "id": "warn-steep-descent",
    "type": "warning",
    "name": "Steep downhill stretch",
    "nameMs": "Jalan menurun dengan curam",
    "desc": "Steep downhill stretch. Select a lower gear to help control your speed on the descent.",
    "descMs": "Jalan menurun dengan curam. Gunakan gear rendah untuk membantu mengawal kelajuan semasa menurun.",
    "meaning": "Steep downhill stretch",
    "meaningMs": "Jalan menurun dengan curam",
    "action": "Select a lower gear to help control your speed on the descent.",
    "actionMs": "Gunakan gear rendah untuk membantu mengawal kelajuan semasa menurun.",
    "source": "KPP General PDF page 50",
    "img": "/signs/eb9c555ec03577f6.svg"
  },
  {
    "id": "warn-narrow-bridge",
    "type": "warning",
    "name": "Narrow bridge ahead",
    "nameMs": "Jambatan sempit di hadapan",
    "desc": "Narrow bridge ahead. Slow down and give way if a vehicle coming the other way is closer to the bridge.",
    "descMs": "Jambatan sempit di hadapan. Perlahankan kenderaan dan beri laluan jika kenderaan dari arah bertentangan lebih hampir dengan jambatan.",
    "meaning": "Narrow bridge ahead",
    "meaningMs": "Jambatan sempit di hadapan",
    "action": "Slow down and give way if a vehicle coming the other way is closer to the bridge.",
    "actionMs": "Perlahankan kenderaan dan beri laluan jika kenderaan dari arah bertentangan lebih hampir dengan jambatan.",
    "source": "KPP General PDF page 51",
    "img": "/signs/d1e9a6d6aab128b3.svg"
  },
  {
    "id": "warn-slippery-road",
    "type": "warning",
    "name": "Slippery road surface",
    "nameMs": "Permukaan jalan licin",
    "desc": "Slippery road surface. Slow smoothly, avoid hard braking and leave a safe gap.",
    "descMs": "Permukaan jalan licin. Perlahankan kenderaan dengan lancar, elakkan brek mengejut dan kekalkan jarak selamat.",
    "meaning": "Slippery road surface",
    "meaningMs": "Permukaan jalan licin",
    "action": "Slow smoothly, avoid hard braking and leave a safe gap.",
    "actionMs": "Perlahankan kenderaan dengan lancar, elakkan brek mengejut dan kekalkan jarak selamat.",
    "source": "KPP General PDF page 51",
    "img": "/signs/9702f462c37241a4.svg"
  },
  {
    "id": "warn-stop-ahead",
    "type": "warning",
    "name": "Stop sign ahead",
    "nameMs": "Tanda berhenti di hadapan",
    "desc": "Stop sign ahead. Slow down early and be ready to come to a complete stop at the actual stop sign.",
    "descMs": "Tanda berhenti di hadapan. Perlahankan kenderaan awal dan bersedia untuk berhenti sepenuhnya di tanda berhenti sebenar.",
    "meaning": "Stop sign ahead",
    "meaningMs": "Tanda berhenti di hadapan",
    "action": "Slow down early and be ready to come to a complete stop at the actual stop sign.",
    "actionMs": "Perlahankan kenderaan awal dan bersedia untuk berhenti sepenuhnya di tanda berhenti sebenar.",
    "source": "KPP General PDF page 52",
    "img": "/signs/add368369889404d.svg"
  },
  {
    "id": "warn-other-danger",
    "type": "warning",
    "name": "Other hazard ahead",
    "nameMs": "Bahaya lain di hadapan",
    "desc": "Other hazard ahead. Drive carefully and watch for unexpected hazards.",
    "descMs": "Bahaya lain di hadapan. Pandu dengan berhati-hati dan awasi bahaya yang tidak dijangka.",
    "meaning": "Other hazard ahead",
    "meaningMs": "Bahaya lain di hadapan",
    "action": "Drive carefully and watch for unexpected hazards.",
    "actionMs": "Pandu dengan berhati-hati dan awasi bahaya yang tidak dijangka.",
    "source": "KPP General PDF page 52",
    "img": "/signs/3f13bbd2ffe5c466.svg"
  },
  {
    "id": "warn-falling-rocks",
    "type": "warning",
    "name": "Risk of falling rocks",
    "nameMs": "Risiko runtuhan batu",
    "desc": "Risk of falling rocks. Watch the road for fallen material before continuing.",
    "descMs": "Risiko runtuhan batu. Perhatikan bahan runtuhan di jalan sebelum meneruskan perjalanan.",
    "meaning": "Risk of falling rocks",
    "meaningMs": "Risiko runtuhan batu",
    "action": "Watch the road for fallen material before continuing.",
    "actionMs": "Perhatikan bahan runtuhan di jalan sebelum meneruskan perjalanan.",
    "source": "KPP General PDF page 53",
    "img": "/signs/adc5145404e740b4.svg"
  },
  {
    "id": "warn-blind-crossing",
    "type": "warning",
    "name": "Blind pedestrians may cross",
    "nameMs": "Orang buta mungkin melintas",
    "desc": "Blind pedestrians may cross. Slow down, give people time to cross and avoid sounding the horn.",
    "descMs": "Orang buta mungkin melintas. Perlahankan kenderaan, beri masa untuk orang melintas dan elakkan membunyikan hon.",
    "meaning": "Blind pedestrians may cross",
    "meaningMs": "Orang buta mungkin melintas",
    "action": "Slow down, give people time to cross and avoid sounding the horn.",
    "actionMs": "Perlahankan kenderaan, beri masa untuk orang melintas dan elakkan membunyikan hon.",
    "source": "KPP General PDF page 54",
    "img": "/signs/f986766e1fca4c02.svg"
  },
  {
    "id": "warn-railway-gated",
    "type": "warning",
    "name": "Gated rail crossing",
    "nameMs": "Lintasan kereta api berpagar",
    "desc": "Gated rail crossing. Stop and wait for the gate to open before proceeding carefully.",
    "descMs": "Lintasan kereta api berpagar. Berhenti dan tunggu pagar dibuka sebelum meneruskan perjalanan dengan berhati-hati.",
    "meaning": "Gated rail crossing",
    "meaningMs": "Lintasan kereta api berpagar",
    "action": "Stop and wait for the gate to open before proceeding carefully.",
    "actionMs": "Berhenti dan tunggu pagar dibuka sebelum meneruskan perjalanan dengan berhati-hati.",
    "source": "KPP General PDF page 56",
    "img": "/signs/e846f69e41c180a7.svg"
  },
  {
    "id": "prohib-no-overtaking",
    "type": "prohibitory",
    "name": "No overtaking",
    "nameMs": "Dilarang memotong",
    "desc": "No overtaking. Stay behind the vehicle ahead in this area.",
    "descMs": "Dilarang memotong. Kekal di belakang kenderaan di hadapan dalam kawasan ini.",
    "meaning": "No overtaking",
    "meaningMs": "Dilarang memotong",
    "action": "Stay behind the vehicle ahead in this area.",
    "actionMs": "Kekal di belakang kenderaan di hadapan dalam kawasan ini.",
    "source": "KPP General PDF page 57",
    "img": "/signs/2f019822b1b9e39f.svg"
  },
  {
    "id": "prohib-no-horn",
    "type": "prohibitory",
    "name": "No sounding the horn",
    "nameMs": "Dilarang membunyikan hon",
    "desc": "No sounding the horn. Keep the horn silent in this area.",
    "descMs": "Dilarang membunyikan hon. Jangan bunyikan hon di kawasan ini.",
    "meaning": "No sounding the horn",
    "meaningMs": "Dilarang membunyikan hon",
    "action": "Keep the horn silent in this area.",
    "actionMs": "Jangan bunyikan hon di kawasan ini.",
    "source": "KPP General PDF page 57",
    "img": "/signs/ce55b86645694f5d.svg"
  },
  {
    "id": "prohib-no-entry",
    "type": "prohibitory",
    "name": "No vehicle entry",
    "nameMs": "Kenderaan dilarang masuk",
    "desc": "No vehicle entry. Plan your route so you can obey this restriction.",
    "descMs": "Kenderaan dilarang masuk. Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "meaning": "No vehicle entry",
    "meaningMs": "Kenderaan dilarang masuk",
    "action": "Plan your route so you can obey this restriction.",
    "actionMs": "Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "source": "KPP General PDF page 57",
    "img": "/signs/9a316a4baac9f49a.svg"
  },
  {
    "id": "prohib-no-left-turn",
    "type": "prohibitory",
    "name": "No left turn",
    "nameMs": "Dilarang membelok ke kiri",
    "desc": "No left turn. Plan your route so you can obey this restriction.",
    "descMs": "Dilarang membelok ke kiri. Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "meaning": "No left turn",
    "meaningMs": "Dilarang membelok ke kiri",
    "action": "Plan your route so you can obey this restriction.",
    "actionMs": "Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "source": "KPP General PDF page 57",
    "img": "/signs/ef495735d6870ce2.svg"
  },
  {
    "id": "prohib-no-right-turn",
    "type": "prohibitory",
    "name": "No right turn",
    "nameMs": "Dilarang membelok ke kanan",
    "desc": "No right turn. Use another route if you need to turn right.",
    "descMs": "Dilarang membelok ke kanan. Gunakan laluan lain jika anda perlu membelok ke kanan.",
    "meaning": "No right turn",
    "meaningMs": "Dilarang membelok ke kanan",
    "action": "Use another route if you need to turn right.",
    "actionMs": "Gunakan laluan lain jika anda perlu membelok ke kanan.",
    "source": "KPP General PDF page 57",
    "img": "/signs/2eee15e55fa0ef48.svg"
  },
  {
    "id": "prohib-no-u-turn",
    "type": "prohibitory",
    "name": "No U-turn",
    "nameMs": "Dilarang membuat pusingan U",
    "desc": "No U-turn. Plan your route so you can obey this restriction.",
    "descMs": "Dilarang membuat pusingan U. Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "meaning": "No U-turn",
    "meaningMs": "Dilarang membuat pusingan U",
    "action": "Plan your route so you can obey this restriction.",
    "actionMs": "Rancang laluan supaya anda dapat mematuhi larangan ini.",
    "source": "KPP General PDF page 58",
    "img": "/signs/a299aef5bccc0fca.svg"
  },
  {
    "id": "prohib-no-motorcycles",
    "type": "prohibitory",
    "name": "No motorcycle entry",
    "nameMs": "Motosikal dilarang masuk",
    "desc": "No motorcycle entry. Choose an alternative route if riding a motorcycle.",
    "descMs": "Motosikal dilarang masuk. Pilih laluan lain jika menunggang motosikal.",
    "meaning": "No motorcycle entry",
    "meaningMs": "Motosikal dilarang masuk",
    "action": "Choose an alternative route if riding a motorcycle.",
    "actionMs": "Pilih laluan lain jika menunggang motosikal.",
    "source": "KPP General PDF page 58",
    "img": "/signs/efd2fb23c0d0e1ac.svg"
  },
  {
    "id": "prohib-no-parking",
    "type": "prohibitory",
    "name": "No parking",
    "nameMs": "Dilarang meletak kenderaan",
    "desc": "No parking. Find a place outside the signed area to park.",
    "descMs": "Dilarang meletak kenderaan. Cari tempat meletak kenderaan di luar kawasan bertanda.",
    "meaning": "No parking",
    "meaningMs": "Dilarang meletak kenderaan",
    "action": "Find a place outside the signed area to park.",
    "actionMs": "Cari tempat meletak kenderaan di luar kawasan bertanda.",
    "source": "KPP General PDF page 58",
    "img": "/signs/fbd415b24ab21b44.svg"
  },
  {
    "id": "prohib-no-stopping",
    "type": "prohibitory",
    "name": "No stopping",
    "nameMs": "Dilarang berhenti",
    "desc": "No stopping. Continue past the signed area before stopping.",
    "descMs": "Dilarang berhenti. Teruskan perjalanan melepasi kawasan bertanda sebelum berhenti.",
    "meaning": "No stopping",
    "meaningMs": "Dilarang berhenti",
    "action": "Continue past the signed area before stopping.",
    "actionMs": "Teruskan perjalanan melepasi kawasan bertanda sebelum berhenti.",
    "source": "KPP General PDF page 59",
    "img": "/signs/ecd3d648f3d4a187.svg"
  },
  {
    "id": "prohib-stop",
    "type": "prohibitory",
    "name": "Stop at the junction",
    "nameMs": "Berhenti di persimpangan",
    "desc": "Stop at the junction. Stop before the line, check both directions and continue only when safe.",
    "descMs": "Berhenti di persimpangan. Berhenti sebelum garisan, periksa kedua-dua arah dan teruskan hanya apabila selamat.",
    "meaning": "Stop at the junction",
    "meaningMs": "Berhenti di persimpangan",
    "action": "Stop before the line, check both directions and continue only when safe.",
    "actionMs": "Berhenti sebelum garisan, periksa kedua-dua arah dan teruskan hanya apabila selamat.",
    "source": "KPP General PDF page 59",
    "img": "/signs/8cd2c7d525ad7c21.svg"
  },
  {
    "id": "prohib-children-crossing-stop",
    "type": "prohibitory",
    "name": "Stop for children crossing",
    "nameMs": "Berhenti untuk kanak-kanak melintas",
    "desc": "Stop for children crossing. Wait for children to clear the crossing before moving off.",
    "descMs": "Berhenti untuk kanak-kanak melintas. Tunggu sehingga kanak-kanak selesai melintas sebelum bergerak.",
    "meaning": "Stop for children crossing",
    "meaningMs": "Berhenti untuk kanak-kanak melintas",
    "action": "Wait for children to clear the crossing before moving off.",
    "actionMs": "Tunggu sehingga kanak-kanak selesai melintas sebelum bergerak.",
    "source": "KPP General PDF page 59",
    "img": "/signs/e22b17f982a5ee46.svg"
  },
  {
    "id": "prohib-speed-limit-ends",
    "type": "prohibitory",
    "name": "End of the posted speed limit",
    "nameMs": "Had laju yang dipaparkan tamat",
    "desc": "End of the posted speed limit. Follow the next applicable speed limit.",
    "descMs": "Had laju yang dipaparkan tamat. Patuhi had laju seterusnya yang berkuat kuasa.",
    "meaning": "End of the posted speed limit",
    "meaningMs": "Had laju yang dipaparkan tamat",
    "action": "Follow the next applicable speed limit.",
    "actionMs": "Patuhi had laju seterusnya yang berkuat kuasa.",
    "source": "KPP General PDF page 60",
    "img": "/signs/63b26ca2bbf8dc2b.png"
  },
  {
    "id": "prohib-weight-limit",
    "type": "prohibitory",
    "name": "No entry over 8 tonnes",
    "nameMs": "Kenderaan melebihi 8 tan dilarang masuk",
    "desc": "No entry over 8 tonnes. Use another route if your vehicle exceeds the weight shown.",
    "descMs": "Kenderaan melebihi 8 tan dilarang masuk. Gunakan laluan lain jika kenderaan melebihi berat yang dipaparkan.",
    "meaning": "No entry over 8 tonnes",
    "meaningMs": "Kenderaan melebihi 8 tan dilarang masuk",
    "action": "Use another route if your vehicle exceeds the weight shown.",
    "actionMs": "Gunakan laluan lain jika kenderaan melebihi berat yang dipaparkan.",
    "source": "KPP General PDF page 62",
    "img": "/signs/ed63604f3712ca41.svg"
  },
  {
    "id": "mand-one-way",
    "type": "mandatory",
    "name": "One-way traffic",
    "nameMs": "Lalu lintas sehala",
    "desc": "One-way traffic. Follow the direction of the arrow.",
    "descMs": "Lalu lintas sehala. Ikut arah anak panah.",
    "meaning": "One-way traffic",
    "meaningMs": "Lalu lintas sehala",
    "action": "Follow the direction of the arrow.",
    "actionMs": "Ikut arah anak panah.",
    "source": "KPP General PDF page 63",
    "img": "/signs/396a58e1a26f5557.svg"
  },
  {
    "id": "mand-turn-left-only",
    "type": "mandatory",
    "name": "Turn left only",
    "nameMs": "Belok ke kiri sahaja",
    "desc": "Turn left only. Follow the required direction.",
    "descMs": "Belok ke kiri sahaja. Ikut arah yang diwajibkan.",
    "meaning": "Turn left only",
    "meaningMs": "Belok ke kiri sahaja",
    "action": "Follow the required direction.",
    "actionMs": "Ikut arah yang diwajibkan.",
    "source": "KPP General PDF page 63",
    "img": "/signs/57708bf453b84a72.svg"
  },
  {
    "id": "mand-turn-right-only",
    "type": "mandatory",
    "name": "Turn right only",
    "nameMs": "Belok ke kanan sahaja",
    "desc": "Turn right only. Follow the required direction.",
    "descMs": "Belok ke kanan sahaja. Ikut arah yang diwajibkan.",
    "meaning": "Turn right only",
    "meaningMs": "Belok ke kanan sahaja",
    "action": "Follow the required direction.",
    "actionMs": "Ikut arah yang diwajibkan.",
    "source": "KPP General PDF page 63",
    "img": "/signs/cbae8fe06ab6d6f0.svg"
  },
  {
    "id": "mand-turn-right-ahead",
    "type": "mandatory",
    "name": "Compulsory right turn",
    "nameMs": "Wajib belok ke kanan",
    "desc": "Compulsory right turn. Follow the required direction.",
    "descMs": "Wajib belok ke kanan. Ikut arah yang diwajibkan.",
    "meaning": "Compulsory right turn",
    "meaningMs": "Wajib belok ke kanan",
    "action": "Follow the required direction.",
    "actionMs": "Ikut arah yang diwajibkan.",
    "source": "KPP General PDF page 63",
    "img": "/signs/c70027b1fa8b10e9.svg"
  },
  {
    "id": "mand-keep-left",
    "type": "mandatory",
    "name": "Pass on the left",
    "nameMs": "Lalu di sebelah kiri",
    "desc": "Pass on the left. Follow the instruction shown on the sign.",
    "descMs": "Lalu di sebelah kiri. Patuhi arahan pada papan tanda.",
    "meaning": "Pass on the left",
    "meaningMs": "Lalu di sebelah kiri",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 64",
    "img": "/signs/24dc89f9e7127cca.svg"
  },
  {
    "id": "mand-keep-right",
    "type": "mandatory",
    "name": "Pass on the right",
    "nameMs": "Lalu di sebelah kanan",
    "desc": "Pass on the right. Follow the instruction shown on the sign.",
    "descMs": "Lalu di sebelah kanan. Patuhi arahan pada papan tanda.",
    "meaning": "Pass on the right",
    "meaningMs": "Lalu di sebelah kanan",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 64",
    "img": "/signs/a50c8dd8a202a25e.svg"
  },
  {
    "id": "mand-pass-either-side",
    "type": "mandatory",
    "name": "Pass on either side",
    "nameMs": "Lalu di mana-mana sisi",
    "desc": "Pass on either side. Follow the instruction shown on the sign.",
    "descMs": "Lalu di mana-mana sisi. Patuhi arahan pada papan tanda.",
    "meaning": "Pass on either side",
    "meaningMs": "Lalu di mana-mana sisi",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 64",
    "img": "/signs/6103dff69316bf86.svg"
  },
  {
    "id": "mand-motorcycle-track",
    "type": "mandatory",
    "name": "Lane for motorcycles",
    "nameMs": "Lorong untuk motosikal",
    "desc": "Lane for motorcycles. Follow the instruction shown on the sign.",
    "descMs": "Lorong untuk motosikal. Patuhi arahan pada papan tanda.",
    "meaning": "Lane for motorcycles",
    "meaningMs": "Lorong untuk motosikal",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 65",
    "img": "/signs/e0389a069e72ed52.png"
  },
  {
    "id": "mand-bicycle-track",
    "type": "mandatory",
    "name": "Lane for bicycles",
    "nameMs": "Lorong untuk basikal",
    "desc": "Lane for bicycles. Follow the instruction shown on the sign.",
    "descMs": "Lorong untuk basikal. Patuhi arahan pada papan tanda.",
    "meaning": "Lane for bicycles",
    "meaningMs": "Lorong untuk basikal",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 65",
    "img": "/signs/e86785fec1877d75.png"
  },
  {
    "id": "mand-trishaw-track",
    "type": "mandatory",
    "name": "Lane for trishaws",
    "nameMs": "Lorong untuk beca",
    "desc": "Lane for trishaws. Follow the instruction shown on the sign.",
    "descMs": "Lorong untuk beca. Patuhi arahan pada papan tanda.",
    "meaning": "Lane for trishaws",
    "meaningMs": "Lorong untuk beca",
    "action": "Follow the instruction shown on the sign.",
    "actionMs": "Patuhi arahan pada papan tanda.",
    "source": "KPP General PDF page 65",
    "img": "/signs/fad437bbc08b75fa.png"
  },
  {
    "id": "info-hospital",
    "type": "informational",
    "name": "Hospital",
    "nameMs": "Hospital",
    "desc": "Hospital. Slow down and be ready to give way to emergency vehicles.",
    "descMs": "Hospital. Perlahankan kenderaan dan bersedia memberi laluan kepada kenderaan kecemasan.",
    "meaning": "Hospital",
    "meaningMs": "Hospital",
    "action": "Slow down and be ready to give way to emergency vehicles.",
    "actionMs": "Perlahankan kenderaan dan bersedia memberi laluan kepada kenderaan kecemasan.",
    "source": "KPP General PDF page 67",
    "img": "/signs/dde5874c6044c5f3.svg"
  },
  {
    "id": "info-parking",
    "type": "informational",
    "name": "Vehicle parking",
    "nameMs": "Tempat letak kenderaan",
    "desc": "Vehicle parking. Look for the designated area if you need to park.",
    "descMs": "Tempat letak kenderaan. Cari kawasan yang ditetapkan jika anda perlu meletakkan kenderaan.",
    "meaning": "Vehicle parking",
    "meaningMs": "Tempat letak kenderaan",
    "action": "Look for the designated area if you need to park.",
    "actionMs": "Cari kawasan yang ditetapkan jika anda perlu meletakkan kenderaan.",
    "source": "KPP General PDF page 67",
    "img": "/signs/f6459f68e216bc5d.svg"
  },
  {
    "id": "info-dead-end",
    "type": "informational",
    "name": "Road with no through access",
    "nameMs": "Jalan buntu di hadapan",
    "desc": "Road with no through access. The road does not continue through to another route.",
    "descMs": "Jalan buntu di hadapan. Jalan itu tidak bersambung dengan laluan lain.",
    "meaning": "Road with no through access",
    "meaningMs": "Jalan buntu di hadapan",
    "action": "The road does not continue through to another route.",
    "actionMs": "Jalan itu tidak bersambung dengan laluan lain.",
    "source": "KPP General PDF page 68",
    "img": "/signs/082877f6ec086be6.svg"
  },
  {
    "id": "info-u-turn",
    "type": "informational",
    "name": "Designated U-turn",
    "nameMs": "Tempat pusingan U",
    "desc": "Designated U-turn. It marks a place to turn around. Give way to oncoming traffic before turning.",
    "descMs": "Tempat pusingan U. Tanda ini menunjukkan tempat untuk berpatah balik. Beri laluan kepada trafik dari arah bertentangan sebelum membelok.",
    "meaning": "Designated U-turn",
    "meaningMs": "Tempat pusingan U",
    "action": "It marks a place to turn around. Give way to oncoming traffic before turning.",
    "actionMs": "Tanda ini menunjukkan tempat untuk berpatah balik. Beri laluan kepada trafik dari arah bertentangan sebelum membelok.",
    "source": "KPP General PDF page 69",
    "img": "/signs/8956fe8a103938b3.svg"
  },
  {
    "id": "temp-chevron-diversion",
    "type": "temporary",
    "name": "Route shifts right in a work zone",
    "nameMs": "Laluan beralih ke kanan di zon kerja",
    "desc": "Route shifts right in a work zone. Slow down and follow the change in direction.",
    "descMs": "Laluan beralih ke kanan di zon kerja. Perlahankan kenderaan dan ikut perubahan arah laluan.",
    "meaning": "Route shifts right in a work zone",
    "meaningMs": "Laluan beralih ke kanan di zon kerja",
    "action": "Slow down and follow the change in direction.",
    "actionMs": "Perlahankan kenderaan dan ikut perubahan arah laluan.",
    "source": "KPP General PDF page 76",
    "img": "/signs/263bc825012bcc83.svg"
  }
];

export const trafficRules: TheoryTopicItem[] = [
  {
    "id": "roundabout-right-of-way",
    "title": "Roundabout lanes and signals",
    "titleMs": "Lorong dan isyarat di bulatan",
    "source": "KPP Automatic Driving Curriculum, PDF pages 257–259",
    "badge": "Bahagian B · Bab 6",
    "content": "Use the left lane to turn left and the right lane for a right turn or U-turn. Keep your lane as you circulate and signal left before leaving.",
    "contentMs": "Gunakan lorong kiri untuk membelok ke kiri dan lorong kanan untuk membelok ke kanan atau berpusing balik. Kekalkan lorong dan beri isyarat kiri sebelum keluar."
  },
  {
    "id": "speed-limits-apj",
    "title": "Choosing a safe speed",
    "titleMs": "Memilih kelajuan selamat",
    "source": "KPP Automatic Driving Curriculum, PDF pages 108 and 146",
    "badge": "APJ 1987 · Seksyen 69",
    "content": "Slow down when approaching a junction. Reduce speed on wet bends because tyres have less grip.",
    "contentMs": "Perlahankan kenderaan apabila menghampiri persimpangan. Kurangkan kelajuan di selekoh basah kerana cengkaman tayar berkurang."
  },
  {
    "id": "overtaking-12-steps",
    "title": "Overtaking safely",
    "titleMs": "Memotong dengan selamat",
    "source": "KPP Automatic Driving Curriculum, PDF pages 105–106",
    "badge": "Bahagian B · Bab 6",
    "content": "Check the road ahead and use CITO before moving right. Leave a safe gap beside the other vehicle. Return left only when it is safe and you can see the front of the vehicle you passed in your left side mirror. Avoid overtaking near pedestrian crossings, junctions, bends and hill crests.",
    "contentMs": "Periksa laluan di hadapan dan amalkan CITO sebelum bergerak ke kanan. Kekalkan jarak sisi yang selamat. Kembali ke kiri apabila selamat dan bahagian hadapan kenderaan yang dipotong kelihatan dalam cermin sisi kiri. Elakkan memotong berhampiran lintasan pejalan kaki, persimpangan, selekoh dan puncak bukit."
  },
  {
    "id": "road-markings-discipline",
    "title": "Road markings and yellow boxes",
    "titleMs": "Garisan jalan dan petak kuning",
    "source": "KPP Automatic Driving Curriculum, PDF pages 71 and 73",
    "badge": "Bahagian A · Bab 4",
    "content": "When a broken line is next to a solid line, pass only from the broken-line side and only when clear. Wait outside a yellow box until your exit is clear.",
    "contentMs": "Apabila garisan putus-putus di sebelah garisan terus, potong hanya dari sebelah garisan putus-putus jika laluan lapang. Tunggu di luar petak kuning sehingga laluan keluar lapang."
  },
  {
    "id": "kejara-demerit-system",
    "title": "KEJARA demerit points",
    "titleMs": "Mata demerit KEJARA",
    "source": "KPP General, PDF pages 93–96",
    "badge": "Bahagian C · Bab 7",
    "content": "KEJARA records demerit points for scheduled offences. A competent licence holder receives a warning the first time they accumulate 20 or more points. During suspension, the licence holder cannot drive.",
    "contentMs": "KEJARA merekodkan mata demerit bagi kesalahan berjadual. Pemegang lesen kompeten menerima amaran apabila mengumpul 20 mata atau lebih buat kali pertama. Pemegang lesen tidak boleh memandu semasa penggantungan."
  },
  {
    "id": "apj-offences-compounds",
    "title": "Examples of driving offences",
    "titleMs": "Contoh kesalahan memandu",
    "source": "KPP Automatic Driving Curriculum, PDF pages 78, 162–163 and 165",
    "badge": "Bahagian C · APJ 1987",
    "content": "The handbook lists dangerous driving, careless driving and using a mobile phone while driving as offences. Leave your phone alone while driving so you can concentrate on the road.",
    "contentMs": "Buku panduan menyenaraikan pemanduan berbahaya, pemanduan cuai dan penggunaan telefon bimbit semasa memandu sebagai kesalahan. Elakkan menggunakan telefon supaya tumpuan kekal pada jalan."
  },
  {
    "id": "lmm-licensing-classes",
    "title": "Learning and probationary licences",
    "titleMs": "Lesen belajar dan lesen percubaan",
    "source": "KPP Automatic Driving Curriculum, PDF pages 16, 18 and 20–21",
    "badge": "Bahagian C · Perlesenan",
    "content": "The Learner’s Driving Licence is used during training. Display the L signs while learning and the P signs during the probationary period.",
    "contentMs": "Lesen Belajar Memandu digunakan semasa latihan. Pamerkan tanda L ketika belajar dan tanda P sepanjang tempoh percubaan."
  },
  {
    "id": "transmission-da-vs-d",
    "title": "Automatic and manual controls",
    "titleMs": "Kawalan automatik dan manual",
    "source": "KPP Automatic Driving Curriculum, PDF pages 232–233, and KPP Manual Driving Curriculum, PDF pages 215 and 278–279",
    "badge": "Kelas DA & Kelas D",
    "content": "In an automatic, use the right foot for the brake and accelerator. A manual adds a clutch operated with the left foot. In the manual hill test, stop with the front wheels on the yellow line and complete the ascent and descent within three minutes.",
    "contentMs": "Dalam kereta automatik, gunakan kaki kanan untuk brek dan pemecut. Kereta manual mempunyai pedal cekam yang dikendalikan dengan kaki kiri. Dalam ujian bukit manual, berhenti dengan roda hadapan di atas garisan kuning dan selesaikan pendakian dan penurunan dalam masa tiga minit."
  },
  {
    "id": "traffic-lights-signals",
    "title": "Traffic lights and emergency vehicles",
    "titleMs": "Lampu isyarat dan kenderaan kecemasan",
    "source": "KPP General, PDF page 34 and KPP Automatic Driving Curriculum, PDF pages 70 and 89",
    "badge": "Bahagian A & B",
    "content": "Red means stop. When the light turns amber, stop if you have not passed the line. Proceed on green only when clear. Give priority to emergency vehicles sounding their sirens.",
    "contentMs": "Merah bermaksud berhenti. Apabila lampu bertukar jingga, berhenti jika belum melepasi garisan. Teruskan ketika lampu hijau hanya jika laluan lapang. Beri keutamaan kepada kenderaan kecemasan yang membunyikan siren."
  },
  {
    "id": "parking-stopping-prohibitions",
    "title": "Stopping safely and using tunnels",
    "titleMs": "Berhenti dengan selamat dan memandu di terowong",
    "source": "KPP Automatic Driving Curriculum, PDF pages 139 and 263",
    "badge": "Bahagian B · Bab 6",
    "content": "Avoid stopping at bends, junctions, bus stops and near fire hydrants. In a tunnel, switch on your lights, leave a safe gap and follow the signs.",
    "contentMs": "Elakkan berhenti di selekoh, persimpangan, perhentian bas dan berhampiran pili bomba. Di dalam terowong, nyalakan lampu, kekalkan jarak selamat dan patuhi papan tanda."
  }
];

export const safetyPrinciples: TheoryTopicItem[] = [
  {
    "id": "stopping-distance-following-rules",
    "title": "Following gaps and stopping distance",
    "titleMs": "Jarak mengekori dan jarak berhenti",
    "source": "KPP General, PDF pages 118–120 and 122–123, and KPP Automatic Driving Curriculum, PDF page 146",
    "badge": "Bahagian B · Fizik Brek",
    "content": "Use a two-second following gap in normal conditions and a four-second gap in rain. Before overtaking, scan the road 12 seconds ahead.",
    "contentMs": "Kekalkan jarak mengekori dua saat dalam keadaan biasa dan empat saat ketika hujan. Sebelum memotong, imbas jalan 12 saat ke hadapan."
  },
  {
    "id": "cito-ptp-ipda-defensive",
    "title": "The CITO routine",
    "titleMs": "Rutin CITO",
    "source": "KPP Automatic Driving Curriculum, PDF page 98",
    "badge": "Bahagian B · Bab 5",
    "content": "Check your mirrors, give the appropriate signal, then look over your shoulder to check the blind spot. Move only when it is safe.",
    "contentMs": "Periksa cermin, beri isyarat yang sesuai, kemudian toleh hingga ke paras bahu untuk memeriksa titik buta. Bergerak hanya apabila selamat."
  },
  {
    "id": "cornering-understeer-oversteer",
    "title": "Steering through bends",
    "titleMs": "Mengawal stereng di selekoh",
    "source": "KPP Automatic Driving Curriculum, PDF pages 146 and 260",
    "badge": "Fizik Kenderaan",
    "content": "Reduce speed in wet bends. Too little steering can send the car wide. Turning the wheel too far can tighten the turn and take you into another lane.",
    "contentMs": "Kurangkan kelajuan di selekoh basah. Putaran stereng yang kurang boleh melebarkan belokan. Putaran berlebihan boleh mengecilkan belokan dan membawa kenderaan ke lorong lain."
  },
  {
    "id": "rpk-powder-tyre-diagnostics",
    "title": "RPK vehicle inspection",
    "titleMs": "Pemeriksaan kenderaan RPK",
    "source": "KPP Automatic Driving Curriculum, PDF pages 224–230",
    "badge": "Bahagian C",
    "content": "Before driving, inspect the vehicle and tyres. Look for damage and check the tyres and tread. Make sure the required lights work.",
    "contentMs": "Sebelum memandu, periksa kenderaan dan tayar. Cari kerosakan dan periksa keadaan tayar serta bunganya. Pastikan lampu yang diperlukan berfungsi."
  },
  {
    "id": "rsm-cockpit-drill-ignition",
    "title": "RSM before moving off",
    "titleMs": "RSM sebelum bergerak",
    "source": "KPP Automatic Driving Curriculum, PDF pages 192 and 208",
    "badge": "Bahagian C",
    "content": "Set the parking brake, adjust your seat and mirrors, and fasten your seat belt before moving off. Check the selector position before starting an automatic.",
    "contentMs": "Gunakan brek parkir, laraskan tempat duduk dan cermin, serta pakai tali pinggang keledar sebelum bergerak. Periksa kedudukan pemilih gear sebelum menghidupkan kereta automatik."
  },
  {
    "id": "occupant-crs-headrest-safety",
    "title": "Seat belts and child locks",
    "titleMs": "Tali pinggang keledar dan kunci kanak-kanak",
    "source": "KPP Automatic Driving Curriculum, PDF pages 120 and 158",
    "badge": "Bahagian C · Keselamatan",
    "content": "Use working seat belts. The rear child lock prevents a door from being opened from inside.",
    "contentMs": "Gunakan tali pinggang keledar yang berfungsi. Kunci kanak-kanak menghalang pintu belakang daripada dibuka dari dalam."
  },
  {
    "id": "night-glare-weather-aquaplaning",
    "title": "Glare and aquaplaning",
    "titleMs": "Silau dan akuaplaning",
    "source": "KPP Automatic Driving Curriculum, PDF pages 122, 142 and 146",
    "badge": "Cuaca & Waktu Malam",
    "content": "Adjust your speed when glare limits your view. If your tyres aquaplane, ease off the accelerator gradually and avoid braking or changing direction until grip returns.",
    "contentMs": "Sesuaikan kelajuan apabila silau mengehadkan penglihatan. Jika tayar menggelungsur di atas air, lepaskan pemecut secara beransur-ansur dan elakkan membrek atau menukar arah sehingga cengkaman kembali."
  },
  {
    "id": "emergency-post-crash-protocol",
    "title": "Expressway breakdowns",
    "titleMs": "Kerosakan di lebuh raya",
    "source": "KPP Automatic Driving Curriculum, PDF page 128",
    "badge": "Kecemasan & Kemalangan",
    "content": "Signal left and pull onto the emergency lane if you can. Switch on the hazard lights, put the warning sign within 50 metres behind the vehicle and keep passengers away from traffic.",
    "contentMs": "Beri isyarat kiri dan masuk ke lorong kecemasan jika boleh. Nyalakan lampu kecemasan, letakkan tanda amaran dalam jarak 50 meter di belakang kenderaan dan jauhkan penumpang daripada trafik."
  }
];
