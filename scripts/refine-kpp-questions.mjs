import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { KPP_TEXTBOOK_QUESTIONS } from "./questions-kpp-textbook.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Deep copy
const questions = JSON.parse(JSON.stringify(KPP_TEXTBOOK_QUESTIONS));

console.log(`Loaded ${questions.length} questions.`);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Hand-crafted specific fixes for flawed, tautological, or silly questions
// ─────────────────────────────────────────────────────────────────────────────

const SPECIFIC_FIXES = {
  // Double continuous solid white lines: Rule question with tautological answer
  "mock-da-3:15": {
    question_en: "What rule applies to two parallel continuous solid white lines painted along the center of the road?",
    question_ms: "Apakah peraturan bagi garisan putih berkembar berterusan di tengah-tengah jalan raya ini?",
    options_en: [
      "Overtaking is permitted only when the road ahead is clearly visible for at least 150 metres",
      "Drivers must never cross or straddle these lines to overtake, turn right, or make a U-turn",
      "Crossing is permitted only to overtake slow agricultural machinery or stationary vehicles",
      "Vehicles may cross to make a U-turn provided oncoming traffic is not impeded"
    ],
    options_ms: [
      "Memotong dibenarkan hanya sekiranya jalan di hadapan dapat dilihat dengan jelas sekurang-kurangnya 150 meter",
      "Pemandu dilarang sama sekali melintas atau memijak garisan ini untuk memotong, membelok ke kanan, atau berpusing U",
      "Melintas dibenarkan hanya untuk memotong jentera pertanian yang perlahan atau kenderaan yang rosak",
      "Kenderaan boleh melintas untuk membuat pusingan U asalkan trafik bertentangan tidak terhalang"
    ],
    correct_index: 1,
    explanation_en: "Double continuous solid white lines in the center of the road mean overtaking, crossing, or turning across the lines is strictly prohibited at all times. (KPP Kelas DA/D (2021), KPP01, m/s 75)",
    explanation_ms: "Garisan putih berkembar berterusan di tengah jalan bermaksud dilarang memotong, melintas atau membelok melintasi garisan ini sama sekali. (KPP Kelas DA/D (2021), KPP01, m/s 75)"
  },
  "mock-d-3:15": {
    question_en: "What rule applies to two parallel continuous solid white lines painted along the center of the road?",
    question_ms: "Apakah peraturan bagi garisan putih berkembar berterusan di tengah-tengah jalan raya ini?",
    options_en: [
      "Overtaking is permitted only when the road ahead is clearly visible for at least 150 metres",
      "Drivers must never cross or straddle these lines to overtake, turn right, or make a U-turn",
      "Crossing is permitted only to overtake slow agricultural machinery or stationary vehicles",
      "Vehicles may cross to make a U-turn provided oncoming traffic is not impeded"
    ],
    options_ms: [
      "Memotong dibenarkan hanya sekiranya jalan di hadapan dapat dilihat dengan jelas sekurang-kurangnya 150 meter",
      "Pemandu dilarang sama sekali melintas atau memijak garisan ini untuk memotong, membelok ke kanan, atau berpusing U",
      "Melintas dibenarkan hanya untuk memotong jentera pertanian yang perlahan atau kenderaan yang rosak",
      "Kenderaan boleh melintas untuk membuat pusingan U asalkan trafik bertentangan tidak terhalang"
    ],
    correct_index: 1,
    explanation_en: "Double continuous solid white lines in the center of the road mean overtaking, crossing, or turning across the lines is strictly prohibited at all times. (KPP Kelas DA/D (2021), KPP01, m/s 75)",
    explanation_ms: "Garisan putih berkembar berterusan di tengah jalan bermaksud dilarang memotong, melintas atau membelok melintasi garisan ini sama sekali. (KPP Kelas DA/D (2021), KPP01, m/s 75)"
  },

  // Dashed white line on left, solid white line on right
  "mock-da-4:1": {
    question_en: "What rule applies when the center of the road is marked with a dashed white line on your side and a solid white line on the oncoming side?",
    question_ms: "Apakah peraturan apabila bahagian tengah jalan ditandakan dengan garisan putih putus-putus di sebelah anda dan garisan putih berterusan di sebelah bertentangan?",
    options_en: [
      "Neither direction of traffic is permitted to overtake or cross under any circumstances",
      "Traffic on your side may cross to overtake when safe, while oncoming traffic is prohibited from crossing",
      "Only oncoming traffic on the solid line side is permitted to cross and overtake",
      "Both directions of traffic may cross the center line freely if no vehicles are approaching"
    ],
    options_ms: [
      "Kedua-dua arah trafik dilarang sama sekali daripada memotong atau melintas dalam apa jua keadaan",
      "Trafik di sebelah anda dibenarkan melintas untuk memotong jika selamat, manakala trafik bertentangan dilarang melintas",
      "Hanya trafik bertentangan di sebelah garisan berterusan dibenarkan melintas dan memotong",
      "Kedua-dua arah trafik boleh melintas garisan tengah secara bebas sekiranya tiada kenderaan menghampiri"
    ],
    correct_index: 1,
    explanation_en: "Traffic travelling adjacent to the dashed line may cross to overtake when safe; traffic adjacent to the solid line must not cross. (KPP Kelas DA/D (2021), KPP01, m/s 76)",
    explanation_ms: "Trafik di sebelah garisan putus-putus dibenarkan melintas untuk memotong apabila selamat; trafik di sebelah garisan berterusan dilarang melintas. (KPP Kelas DA/D (2021), KPP01, m/s 76)"
  },
  "mock-d-4:1": {
    question_en: "What rule applies when the center of the road is marked with a dashed white line on your side and a solid white line on the oncoming side?",
    question_ms: "Apakah peraturan apabila bahagian tengah jalan ditandakan dengan garisan putih putus-putus di sebelah anda dan garisan putih berterusan di sebelah bertentangan?",
    options_en: [
      "Neither direction of traffic is permitted to overtake or cross under any circumstances",
      "Traffic on your side may cross to overtake when safe, while oncoming traffic is prohibited from crossing",
      "Only oncoming traffic on the solid line side is permitted to cross and overtake",
      "Both directions of traffic may cross the center line freely if no vehicles are approaching"
    ],
    options_ms: [
      "Kedua-dua arah trafik dilarang sama sekali daripada memotong atau melintas dalam apa jua keadaan",
      "Trafik di sebelah anda dibenarkan melintas untuk memotong jika selamat, manakala trafik bertentangan dilarang melintas",
      "Hanya trafik bertentangan di sebelah garisan berterusan dibenarkan melintas dan memotong",
      "Kedua-dua arah trafik boleh melintas garisan tengah secara bebas sekiranya tiada kenderaan menghampiri"
    ],
    correct_index: 1,
    explanation_en: "Traffic travelling adjacent to the dashed line may cross to overtake when safe; traffic adjacent to the solid line must not cross. (KPP Kelas DA/D (2021), KPP01, m/s 76)",
    explanation_ms: "Trafik di sebelah garisan putus-putus dibenarkan melintas untuk memotong apabila selamat; trafik di sebelah garisan berterusan dilarang melintas. (KPP Kelas DA/D (2021), KPP01, m/s 76)"
  },

  // Yellow box junction
  "mock-da-4:2": {
    question_en: "What rule applies to drivers approaching an intersection marked with a yellow criss-cross box (Petak Kuning)?",
    question_ms: "Apakah peraturan yang dikenakan kepada pemandu yang menghampiri persimpangan bertanda Petak Kuning?",
    options_en: [
      "Do not enter the box unless your exit road is clear, except when waiting to turn right and held up only by oncoming traffic",
      "Vehicles may enter and stop inside the box whenever the traffic light in their favour is green",
      "Commercial buses and emergency taxis have automatic right of way to queue inside the box",
      "Drivers may stop inside the box to drop off passengers if hazard flashers are switched on"
    ],
    options_ms: [
      "Dilarang memasuki petak melainkan laluan keluar anda lapang, kecuali ketika menunggu untuk membelok ke kanan dan hanya dihalang trafik bertentangan",
      "Kenderaan boleh masuk dan berhenti di dalam petak setiap kali lampu isyarat menghijau memihak kepada mereka",
      "Bas komersial dan teksi kecemasan mempunyai keutamaan automatik untuk beratur di dalam petak",
      "Pemandu dibenarkan berhenti di dalam petak untuk menurunkan penumpang sekiranya lampu kecemasan dinyalakan"
    ],
    correct_index: 0,
    explanation_en: "Do not enter the yellow box junction unless your exit lane is unobstructed, except when turning right and waiting for oncoming traffic to clear. (KPP Kelas DA/D (2021), KPP01, m/s 77)",
    explanation_ms: "Jangan memasuki persimpangan petak kuning melainkan laluan keluar tidak terhalang, kecuali apabila hendak membelok ke kanan dan menunggu trafik bertentangan lapang. (KPP Kelas DA/D (2021), KPP01, m/s 77)"
  },
  "mock-d-4:2": {
    question_en: "What rule applies to drivers approaching an intersection marked with a yellow criss-cross box (Petak Kuning)?",
    question_ms: "Apakah peraturan yang dikenakan kepada pemandu yang menghampiri persimpangan bertanda Petak Kuning?",
    options_en: [
      "Do not enter the box unless your exit road is clear, except when waiting to turn right and held up only by oncoming traffic",
      "Vehicles may enter and stop inside the box whenever the traffic light in their favour is green",
      "Commercial buses and emergency taxis have automatic right of way to queue inside the box",
      "Drivers may stop inside the box to drop off passengers if hazard flashers are switched on"
    ],
    options_ms: [
      "Dilarang memasuki petak melainkan laluan keluar anda lapang, kecuali ketika menunggu untuk membelok ke kanan dan hanya dihalang trafik bertentangan",
      "Kenderaan boleh masuk dan berhenti di dalam petak setiap kali lampu isyarat menghijau memihak kepada mereka",
      "Bas komersial dan teksi kecemasan mempunyai keutamaan automatik untuk beratur di dalam petak",
      "Pemandu dibenarkan berhenti di dalam petak untuk menurunkan penumpang sekiranya lampu kecemasan dinyalakan"
    ],
    correct_index: 0,
    explanation_en: "Do not enter the yellow box junction unless your exit lane is unobstructed, except when turning right and waiting for oncoming traffic to clear. (KPP Kelas DA/D (2021), KPP01, m/s 77)",
    explanation_ms: "Jangan memasuki persimpangan petak kuning melainkan laluan keluar tidak terhalang, kecuali apabila hendak membelok ke kanan dan menunggu trafik bertentangan lapang. (KPP Kelas DA/D (2021), KPP01, m/s 77)"
  },

  // Single continuous yellow line along kerb
  "mock-da-4:3": {
    question_en: "What restriction is indicated by a single continuous yellow line painted along the left kerb or edge of the carriageway?",
    question_ms: "Apakah sekatan yang ditunjukkan oleh satu garisan kuning berterusan yang dicat di tepi bahu atau bebendul jalan ini?",
    options_en: [
      "Stopping momentarily to set down passengers is strictly prohibited at all hours of the day",
      "Parking is prohibited along this side of the road during the hours indicated on the sign",
      "Motorcycles are exempt and may park along the roadway shoulder without restriction",
      "Commercial lorries are required to use this edge lane exclusively when loading goods"
    ],
    options_ms: [
      "Berhenti seketika untuk menurunkan penumpang dilarang sama sekali pada setiap waktu sepanjang hari",
      "Dilarang meletakkan kenderaan di sepanjang bahagian jalan ini pada masa yang dinyatakan pada papan tanda",
      "Motosikal dikecualikan dan dibenarkan meletak kenderaan di bahu jalan tanpa sebarang sekatan",
      "Lori komersial diwajibkan menggunakan lorong tepi ini secara eksklusif semasa memunggah barangan"
    ],
    correct_index: 1,
    explanation_en: "A single continuous yellow kerb line prohibits parking during controlled hours. (KPP Kelas DA/D (2021), KPP01, m/s 77)",
    explanation_ms: "Satu garisan kuning berterusan di tepi jalan melarang meletak kenderaan pada masa yang ditetapkan. (KPP Kelas DA/D (2021), KPP01, m/s 77)"
  },
  "mock-d-4:3": {
    question_en: "What restriction is indicated by a single continuous yellow line painted along the left kerb or edge of the carriageway?",
    question_ms: "Apakah sekatan yang ditunjukkan oleh satu garisan kuning berterusan yang dicat di tepi bahu atau bebendul jalan ini?",
    options_en: [
      "Stopping momentarily to set down passengers is strictly prohibited at all hours of the day",
      "Parking is prohibited along this side of the road during the hours indicated on the sign",
      "Motorcycles are exempt and may park along the roadway shoulder without restriction",
      "Commercial lorries are required to use this edge lane exclusively when loading goods"
    ],
    options_ms: [
      "Berhenti seketika untuk menurunkan penumpang dilarang sama sekali pada setiap waktu sepanjang hari",
      "Dilarang meletakkan kenderaan di sepanjang bahagian jalan ini pada masa yang dinyatakan pada papan tanda",
      "Motosikal dikecualikan dan dibenarkan meletak kenderaan di bahu jalan tanpa sebarang sekatan",
      "Lori komersial diwajibkan menggunakan lorong tepi ini secara eksklusif semasa memunggah barangan"
    ],
    correct_index: 1,
    explanation_en: "A single continuous yellow kerb line prohibits parking during controlled hours. (KPP Kelas DA/D (2021), KPP01, m/s 77)",
    explanation_ms: "Satu garisan kuning berterusan di tepi jalan melarang meletak kenderaan pada masa yang ditetapkan. (KPP Kelas DA/D (2021), KPP01, m/s 77)"
  },

  // Transverse rumble bars
  "mock-da-4:4": {
    question_en: "What is the primary function of yellow transverse rumble bars painted across a lane approaching a hazard?",
    question_ms: "Apakah fungsi utama garisan melintang kuning yang dicat merentangi lorong laluan menghampiri kawasan bahaya?",
    options_en: [
      "To demarcate a priority shared pedestrian and cyclist crossing zone across the roadway",
      "To produce audible and physical tyre vibrations warning drivers to slow down before a hazard",
      "To calibrate roadside speed cameras and automatic number plate recognition systems",
      "To improve drainage flow and stop rainwater from pooling across the carriageway surface"
    ],
    options_ms: [
      "Untuk menandakan zon lintasan kongsi pejalan kaki dan penunggang basikal di jalan raya",
      "Untuk menghasilkan getaran bunyi dan fizikal pada tayar bagi memberi amaran memperlahankan kelajuan",
      "Untuk menentukur kamera perangkap kelajuan dan sistem pengimbas nombor pendaftaran",
      "Untuk meningkatkan aliran saliran dan menghalang air hujan daripada bertakung di permukaan jalan"
    ],
    correct_index: 1,
    explanation_en: "Transverse rumble bars warn the driver through vibration and sound to reduce speed approaching a hazard such as a junction, curve, or toll plaza. (KPP Kelas DA/D (2021), KPP01, m/s 78)",
    explanation_ms: "Garisan melintang memberi amaran melalui getaran dan bunyi kepada pemandu untuk memperlahankan kenderaan sebelum tiba di kawasan bahaya. (KPP Kelas DA/D (2021), KPP01, m/s 78)"
  },
  "mock-d-4:4": {
    question_en: "What is the primary function of yellow transverse rumble bars painted across a lane approaching a hazard?",
    question_ms: "Apakah fungsi utama garisan melintang kuning yang dicat merentangi lorong laluan menghampiri kawasan bahaya?",
    options_en: [
      "To demarcate a priority shared pedestrian and cyclist crossing zone across the roadway",
      "To produce audible and physical tyre vibrations warning drivers to slow down before a hazard",
      "To calibrate roadside speed cameras and automatic number plate recognition systems",
      "To improve drainage flow and stop rainwater from pooling across the carriageway surface"
    ],
    options_ms: [
      "Untuk menandakan zon lintasan kongsi pejalan kaki dan penunggang basikal di jalan raya",
      "Untuk menghasilkan getaran bunyi dan fizikal pada tayar bagi memberi amaran memperlahankan kelajuan",
      "Untuk menentukur kamera perangkap kelajuan dan sistem pengimbas nombor pendaftaran",
      "Untuk meningkatkan aliran saliran dan menghalang air hujan daripada bertakung di permukaan jalan"
    ],
    correct_index: 1,
    explanation_en: "Transverse rumble bars warn the driver through vibration and sound to reduce speed approaching a hazard such as a junction, curve, or toll plaza. (KPP Kelas DA/D (2021), KPP01, m/s 78)",
    explanation_ms: "Garisan melintang memberi amaran melalui getaran dan bunyi kepada pemandu untuk memperlahankan kenderaan sebelum tiba di kawasan bahaya. (KPP Kelas DA/D (2021), KPP01, m/s 78)"
  },

  // Road works 200m ahead
  "mock-da-2:14": {
    options_en: [
      "Temporary diversion route ends in 200 metres returning to highway",
      "Heavy machinery access entrance 200 metres ahead on the left shoulder",
      "Speed enforcement camera operating 200 metres ahead in the work zone",
      "Construction or road maintenance work in progress 200 metres ahead"
    ],
    options_ms: [
      "Laluan lencongan tamat dalam 200 meter dan kembali ke jalan asal",
      "Laluan masuk jentera berat 200 meter di hadapan pada bahu jalan kiri",
      "Kamera perangkap kelajuan beroperasi 200 meter di zon pembinaan",
      "Kerja pembinaan atau penyelenggaraan jalan sedang dijalankan 200 meter di hadapan"
    ],
    correct_index: 3
  },
  "mock-d-2:14": {
    options_en: [
      "Temporary diversion route ends in 200 metres returning to highway",
      "Heavy machinery access entrance 200 metres ahead on the left shoulder",
      "Speed enforcement camera operating 200 metres ahead in the work zone",
      "Construction or road maintenance work in progress 200 metres ahead"
    ],
    options_ms: [
      "Laluan lencongan tamat dalam 200 meter dan kembali ke jalan asal",
      "Laluan masuk jentera berat 200 meter di hadapan pada bahu jalan kiri",
      "Kamera perangkap kelajuan beroperasi 200 meter di zon pembinaan",
      "Kerja pembinaan atau penyelenggaraan jalan sedang dijalankan 200 meter di hadapan"
    ],
    correct_index: 3
  },

  // Road works / workers ahead (remove archaeological site & playground)
  "mock-da-2:15": {
    options_en: [
      "Quarry extraction and heavy haulage operations active ahead",
      "Agricultural machinery crossing zone located ahead on the roadway",
      "Emergency landslide clearance operations ahead on the hillside",
      "Road maintenance crews or construction workers working ahead on the carriageway"
    ],
    options_ms: [
      "Operasi kuari dan lori muatan berat sedang beroperasi di hadapan",
      "Zon lintasan jentera pertanian terletak di hadapan pada jalan raya",
      "Operasi kecemasan pembersihan runtuhan tebing di hadapan cerun",
      "Pekerja penyelenggaraan jalan atau kontraktor binaan sedang bertugas di hadapan"
    ],
    correct_index: 3
  },
  "mock-d-2:15": {
    options_en: [
      "Quarry extraction and heavy haulage operations active ahead",
      "Agricultural machinery crossing zone located ahead on the roadway",
      "Emergency landslide clearance operations ahead on the hillside",
      "Road maintenance crews or construction workers working ahead on the carriageway"
    ],
    options_ms: [
      "Operasi kuari dan lori muatan berat sedang beroperasi di hadapan",
      "Zon lintasan jentera pertanian terletak di hadapan pada jalan raya",
      "Operasi kecemasan pembersihan runtuhan tebing di hadapan cerun",
      "Pekerja penyelenggaraan jalan atau kontraktor binaan sedang bertugas di hadapan"
    ],
    correct_index: 3
  },

  // Hospital sign (remove helicopter pad)
  "mock-da-1:13": {
    options_en: [
      "Hotel or motel accommodation facility located ahead",
      "Outpatient health clinic and dispensing pharmacy ahead",
      "Hospital facility ahead offering inpatient care and emergency medical services",
      "Highway rest and service area dormitory ahead"
    ],
    options_ms: [
      "Kemudahan hotel atau motel penginapan terletak di hadapan",
      "Klinik kesihatan pesakit luar dan farmasi dispensari di hadapan",
      "Kemudahan hospital di hadapan dengan wad rawatan dan perkhidmatan kecemasan",
      "Asrama kawasan rehat dan rawat lebuh raya di hadapan"
    ],
    correct_index: 2
  },
  "mock-d-1:13": {
    options_en: [
      "Hotel or motel accommodation facility located ahead",
      "Outpatient health clinic and dispensing pharmacy ahead",
      "Hospital facility ahead offering inpatient care and emergency medical services",
      "Highway rest and service area dormitory ahead"
    ],
    options_ms: [
      "Kemudahan hotel atau motel penginapan terletak di hadapan",
      "Klinik kesihatan pesakit luar dan farmasi dispensari di hadapan",
      "Kemudahan hospital di hadapan dengan wad rawatan dan perkhidmatan kecemasan",
      "Asrama kawasan rehat dan rawat lebuh raya di hadapan"
    ],
    correct_index: 2
  },

  // First 10-15 minutes of light rain (remove asphalt melts, 50 psi, magnetize)
  "mock-da-2:31": {
    question_en: "Why are the first 10 to 15 minutes of light rain after a dry spell especially slippery on roads?",
    question_ms: "Mengapakah 10 hingga 15 minit pertama hujan renyai selepas cuaca panas berpanjangan menyebabkan jalan sangat licin?",
    options_en: [
      "Road temperature drops suddenly, stiffening the tyre rubber and lowering adhesion",
      "Water droplets enter brake drum assemblies, preventing friction pads from gripping",
      "Rainwater mixes with accumulated oil, fuel residue, rubber particles, and road grime to form a slick film",
      "Humid atmospheric conditions reduce steering hydraulic pressure in passenger vehicles"
    ],
    options_ms: [
      "Suhu jalan menurun mendadak, mengeraskan getah tayar lalu mengurangkan cengkaman",
      "Titisan air memasuki perumah brek gelendong, menghalang geseran pad daripada mencengkam",
      "Air hujan bercampur dengan sisa minyak, bahan api, habuk getah tayar, dan debu menghasilkan lapisan licin",
      "Keadaan atmosfera lembap mengurangkan tekanan hidraulik stereng kenderaan penumpang"
    ],
    correct_index: 2
  },
  "mock-d-2:31": {
    question_en: "Why are the first 10 to 15 minutes of light rain after a dry spell especially slippery on roads?",
    question_ms: "Mengapakah 10 hingga 15 minit pertama hujan renyai selepas cuaca panas berpanjangan menyebabkan jalan sangat licin?",
    options_en: [
      "Road temperature drops suddenly, stiffening the tyre rubber and lowering adhesion",
      "Water droplets enter brake drum assemblies, preventing friction pads from gripping",
      "Rainwater mixes with accumulated oil, fuel residue, rubber particles, and road grime to form a slick film",
      "Humid atmospheric conditions reduce steering hydraulic pressure in passenger vehicles"
    ],
    options_ms: [
      "Suhu jalan menurun mendadak, mengeraskan getah tayar lalu mengurangkan cengkaman",
      "Titisan air memasuki perumah brek gelendong, menghalang geseran pad daripada mencengkam",
      "Air hujan bercampur dengan sisa minyak, bahan api, habuk getah tayar, dan debu menghasilkan lapisan licin",
      "Keadaan atmosfera lembap mengurangkan tekanan hidraulik stereng kenderaan penumpang"
    ],
    correct_index: 2
  },

  // Commercial vehicle KEJARA demerit penalties (remove bigger number plates, count wheels, night buses)
  "mock-da-2:41": {
    question_en: "Under the KEJARA Demerit Points System, why are penalties and demerit points for traffic offences enforced strictly for heavy vehicle drivers?",
    question_ms: "Di bawah Sistem Mata Demerit KEJARA, mengapakah penalti dan mata demerit bagi kesalahan jalan raya dikenakan dengan tegas terhadap pemandu kenderaan berat?",
    options_en: [
      "Commercial vehicle driving licences require quarterly renewal whereas private competent licences do not",
      "Heavy goods vehicles are prohibited from using pneumatic braking systems on high-speed expressways",
      "Commercial transport operators are exempt from mandatory periodic vehicle roadworthiness inspections",
      "Heavy commercial vehicles have greater mass and momentum, meaning collisions carry severe multi-fatality risks"
    ],
    options_ms: [
      "Lesen kenderaan komersial perlu diperbaharui setiap suku tahun berbanding lesen kompeten persendirian",
      "Kenderaan barangan berat dilarang menggunakan sistem brek pneumatik di laluan lebuh raya laju",
      "Pengendali pengangkutan komersial dikecualikan daripada pemeriksaan berkala kelayakan kenderaan",
      "Kenderaan berat mempunyai jisim dan momentum yang besar, menjadikan impak kemalangan berisiko tinggi membabitkan kemalangan maut"
    ],
    correct_index: 3
  },
  "mock-d-2:41": {
    question_en: "Under the KEJARA Demerit Points System, why are penalties and demerit points for traffic offences enforced strictly for heavy vehicle drivers?",
    question_ms: "Di bawah Sistem Mata Demerit KEJARA, mengapakah penalti dan mata demerit bagi kesalahan jalan raya dikenakan dengan tegas terhadap pemandu kenderaan berat?",
    options_en: [
      "Commercial vehicle driving licences require quarterly renewal whereas private competent licences do not",
      "Heavy goods vehicles are prohibited from using pneumatic braking systems on high-speed expressways",
      "Commercial transport operators are exempt from mandatory periodic vehicle roadworthiness inspections",
      "Heavy commercial vehicles have greater mass and momentum, meaning collisions carry severe multi-fatality risks"
    ],
    options_ms: [
      "Lesen kenderaan komersial perlu diperbaharui setiap suku tahun berbanding lesen kompeten persendirian",
      "Kenderaan barangan berat dilarang menggunakan sistem brek pneumatik di laluan lebuh raya laju",
      "Pengendali pengangkutan komersial dikecualikan daripada pemeriksaan berkala kelayakan kenderaan",
      "Kenderaan berat mempunyai jisim dan momentum yang besar, menjadikan impak kemalangan berisiko tinggi membabitkan kemalangan maut"
    ],
    correct_index: 3
  },

  // Food or drink to injured road crash victim (remove insurance void, police drinks, tyre pressure)
  "mock-da-1:29": {
    question_en: "Why must you never give food or drink to an injured road crash victim at the scene?",
    question_ms: "Mengapakah anda dilarang sama sekali memberikan makanan atau minuman kepada mangsa kemalangan yang cedera di lokasi kejadian?",
    options_en: [
      "Offering drinks may distract the casualty from providing their driving licence details",
      "Fluid intake immediately alters blood alcohol test readings before traffic police arrive",
      "The victim may have internal injuries requiring emergency surgery under anaesthesia, posing a choking risk",
      "Giving plain water causes sudden cardiovascular shock and hypothermia during roadside waiting"
    ],
    options_ms: [
      "Memberi minuman boleh mengganggu mangsa daripada menyerahkan dokumen lesen memandu",
      "Pengambilan cecair mengubah bacaan ujian alkohol darah sebelum ketibaan polis trafik",
      "Mangsa mungkin mengalami kecederaan dalaman yang memerlukan pembedahan bius kecemasan, membawa risiko tercekik",
      "Pemberian air kosong mengakibatkan kejutan kardiovaskular dan hipotermia mendadak"
    ],
    correct_index: 2
  },
  "mock-d-1:29": {
    question_en: "Why must you never give food or drink to an injured road crash victim at the scene?",
    question_ms: "Mengapakah anda dilarang sama sekali memberikan makanan atau minuman kepada mangsa kemalangan yang cedera di lokasi kejadian?",
    options_en: [
      "Offering drinks may distract the casualty from providing their driving licence details",
      "Fluid intake immediately alters blood alcohol test readings before traffic police arrive",
      "The victim may have internal injuries requiring emergency surgery under anaesthesia, posing a choking risk",
      "Giving plain water causes sudden cardiovascular shock and hypothermia during roadside waiting"
    ],
    options_ms: [
      "Memberi minuman boleh mengganggu mangsa daripada menyerahkan dokumen lesen memandu",
      "Pengambilan cecair mengubah bacaan ujian alkohol darah sebelum ketibaan polis trafik",
      "Mangsa mungkin mengalami kecederaan dalaman yang memerlukan pembedahan bius kecemasan, membawa risiko tercekik",
      "Pemberian air kosong mengakibatkan kejutan kardiovaskular dan hipotermia mendadak"
    ],
    correct_index: 2
  },

  // RPK walkaround documents (remove birth certificate, restaurant receipt, cinema ticket)
  "mock-da-2:47": {
    question_en: "During the exterior walkaround phase of Routine Pemeriksaan Kenderaan (RPK), which documents displayed on the vehicle must the candidate verify?",
    question_ms: "Semasa pemeriksaan bahagian luar kenderaan dalam Rutin Pemeriksaan Kenderaan (RPK), apakah dokumen rasmi pada cermin hadapan yang wajib diperiksa kesahihannya?",
    options_en: [
      "The Motor Vehicle Licence / Road Tax disc (LKM) displayed on the windscreen, verifying its expiry date and registration match",
      "The vehicle original registration grant certificate and manufacturer service warranty booklet",
      "The municipal council parking season permit disc and residential access barcode sticker",
      "The driving institute business registration certificate and instructor accreditation badge"
    ],
    options_ms: [
      "Lesen Kenderaan Motor (LKM / Cukai Jalan) pada cermin hadapan, dengan memastikan tarikh tamat tempoh sah dan nombor pendaftaran sepadan",
      "Perakuan pendaftaran kenderaan (geran asal) dan buku panduan jaminan servis pengeluar kenderaan",
      "Pas bermusim meletak kenderaan pihak berkuasa tempatan dan pelekat akses kediaman berbayar",
      "Sijil pendaftaran perniagaan institut memandu dan lencana akreditasi pengajar memandu yang sah"
    ],
    correct_index: 0
  },
  "mock-d-2:47": {
    question_en: "During the exterior walkaround phase of Routine Pemeriksaan Kenderaan (RPK), which documents displayed on the vehicle must the candidate verify?",
    question_ms: "Semasa pemeriksaan bahagian luar kenderaan dalam Rutin Pemeriksaan Kenderaan (RPK), apakah dokumen rasmi pada cermin hadapan yang wajib diperiksa kesahihannya?",
    options_en: [
      "The Motor Vehicle Licence / Road Tax disc (LKM) displayed on the windscreen, verifying its expiry date and registration match",
      "The vehicle original registration grant certificate and manufacturer service warranty booklet",
      "The municipal council parking season permit disc and residential access barcode sticker",
      "The driving institute business registration certificate and instructor accreditation badge"
    ],
    options_ms: [
      "Lesen Kenderaan Motor (LKM / Cukai Jalan) pada cermin hadapan, dengan memastikan tarikh tamat tempoh sah dan nombor pendaftaran sepadan",
      "Perakuan pendaftaran kenderaan (geran asal) dan buku panduan jaminan servis pengeluar kenderaan",
      "Pas bermusim meletak kenderaan pihak berkuasa tempatan dan pelekat akses kediaman berbayar",
      "Sijil pendaftaran perniagaan institut memandu dan lencana akreditasi pengajar memandu yang sah"
    ],
    correct_index: 0
  },

  // Two-footed driving in automatic (remove left foot is heavier, switch for horn, car reverse)
  "quiz-c-da-4:12": {
    question_en: "In a Class DA Automatic car, why is it recommended to operate both the accelerator and footbrake pedals using only the right foot?",
    question_ms: "Dalam kereta Kelas DA Automatik, mengapakah disyorkan untuk mengendalikan kedua-dua pedal pemecut dan brek kaki menggunakan kaki kanan sahaja?",
    options_en: [
      "To maintain higher engine revolutions while cornering through busy urban roundabouts",
      "To avoid simultaneously pressing both pedals during sudden emergency braking and keep the left foot safely on the footrest",
      "Because the automatic transmission disengages whenever the driver moves their left leg",
      "To allow the left foot to operate the secondary parking brake cable while driving"
    ],
    options_ms: [
      "Bagi mengekalkan rpm enjin yang lebih tinggi ketika melalui bulatan bandar yang sibuk",
      "Bagi mengelakkan daripada terpijak kedua-dua pedal serentak semasa membrek kecemasan dan memastikan kaki kiri di atas perehat kaki",
      "Kerana transmisi automatik akan terputus hubungan gear setiap kali kaki kiri digerakkan",
      "Bagi membolehkan kaki kiri menarik kabel brek letak kereta sekunder semasa memandu"
    ],
    correct_index: 1
  },

  // RPK Boot items (remove picnic basket, welding torch, boot empty)
  "quiz-c-da-5:7": {
    question_en: "Which emergency and maintenance equipment must be inspected inside the vehicle luggage compartment (boot) during RPK?",
    question_ms: "Apakah peralatan kecemasan dan penyelenggaraan yang wajib diperiksa di dalam ruang but belakang semasa RPK?",
    options_en: [
      "Emergency towing cable, tyre vulcanising patches, spare bulb set, and digital multimeter",
      "Engine oil top-up bottle, spare spark plugs, battery acid tester, and radiator pressure cap",
      "Spare windscreen wiper set, radiator coolant gallon, replacement fan belt, and fuse pliers",
      "Spare tyre with adequate inflation, vehicle jack and handle, wheel nut wrench, and reflective warning triangle"
    ],
    options_ms: [
      "Tali penunda kecemasan, getah penampal tayar tiub, mentol lampu ganti, dan multimeter digital",
      "Botol minyak enjin ganti, palam pencucuh gantian, tolok asid bateri, dan penutup radiator",
      "Bilah pengelap cermin ganti, sebotol penyejuk radiator, tali sawat ganti, dan playar fius",
      "Tayar ganti bertekanan mencukupi, jek kenderaan berserta pemutar, perengkuh nat roda, dan segi tiga amaran pemantul cahaya"
    ],
    correct_index: 3
  },
  "quiz-c-d-5:7": {
    question_en: "Which emergency and maintenance equipment must be inspected inside the vehicle luggage compartment (boot) during RPK?",
    question_ms: "Apakah peralatan kecemasan dan penyelenggaraan yang wajib diperiksa di dalam ruang but belakang semasa RPK?",
    options_en: [
      "Emergency towing cable, tyre vulcanising patches, spare bulb set, and digital multimeter",
      "Engine oil top-up bottle, spare spark plugs, battery acid tester, and radiator pressure cap",
      "Spare windscreen wiper set, radiator coolant gallon, replacement fan belt, and fuse pliers",
      "Spare tyre with adequate inflation, vehicle jack and handle, wheel nut wrench, and reflective warning triangle"
    ],
    options_ms: [
      "Tali penunda kecemasan, getah penampal tayar tiub, mentol lampu ganti, dan multimeter digital",
      "Botol minyak enjin ganti, palam pencucuh gantian, tolok asid bateri, dan penutup radiator",
      "Bilah pengelap cermin ganti, sebotol penyejuk radiator, tali sawat ganti, dan playar fius",
      "Tayar ganti bertekanan mencukupi, jek kenderaan berserta pemutar, perengkuh nat roda, dan segi tiga amaran pemantul cahaya"
    ],
    correct_index: 3
  },

  // Class DA Ramp (Tanjakan) test requirement (remove 5-minute limit claim)
  "quiz-c-da-5:12": {
    question_en: "When performing the Tanjakan (Ramp) test in a Class DA Automatic car, what is the primary requirement when stopping on the slope?",
    question_ms: "Semasa menjalani ujian Tanjakan (Ramp) bagi kereta Kelas DA Automatik, apakah syarat utama semasa memberhentikan kenderaan di atas cerun?",
    options_en: [
      "Keep selector in Drive (D) while holding the car stationary using only rapid accelerator pedal tapping",
      "Shift selector immediately to Park (P) and turn off ignition key before raising hand to the examiner",
      "Allow the vehicle to roll back slightly until both rear tyres rest against the lower safety barrier",
      "Stop with both front wheels resting within the yellow line, pull the handbrake firmly, and shift to N or P"
    ],
    options_ms: [
      "Kekalkan gear pada posisi Drive (D) dengan menahan kereta menggunakan tekanan pemecut secara berterusan",
      "Tukar gear ke kedudukan Park (P) dan matikan enjin sebelum mengangkat tangan kepada penguji",
      "Biarkan kenderaan mengundur sedikit sehingga kedua-dua tayar belakang menyentuh palang penghadang",
      "Berhenti dengan kedua-dua roda hadapan berada di atas garisan kuning, tarik brek tangan kemas, dan tukar ke N atau P"
    ],
    correct_index: 3,
    explanation_en: "On the ramp, bring both front tyres to a smooth stop on the designated yellow line, apply handbrake firmly, shift to N/P, and signal the examiner. (KPP Kelas DA Automatik (2021), KPP02, m/s 245-248)",
    explanation_ms: "Di atas tanjakan, berhentikan kedua-dua tayar hadapan di atas garisan kuning, tarik brek tangan, tukar gear ke N/P dan beri isyarat kepada penguji. (KPP Kelas DA Automatik (2021), KPP02, m/s 245-248)"
  },

  // Class DA Ramp Movement 1 (remove jumping over ramp, tyres falling off, 40 km/h reverse)
  "quiz-c-da-5:13": {
    question_en: "When beginning Movement 1 of the Class DA Tanjakan (Ramp) circuit test, how should the candidate drive onto the incline?",
    question_ms: "Semasa memulakan Pergerakan 1 ujian litar Tanjakan (Ramp) Kelas DA, bagaimanakah calon harus memandu menaiki tanjakan?",
    options_en: [
      "Accelerate rapidly in Low gear to clear the ramp without coming to a complete standstill on top",
      "Drive up in Reverse gear to maintain maximum rear tyre traction against the concrete gradient",
      "Weave diagonally across the ramp width to minimise engine strain when climbing the incline",
      "Steer straight in Drive (D) with controlled throttle so front wheels climb smoothly onto the ramp and stop"
    ],
    options_ms: [
      "Memecut laju dalam gear rendah untuk melepasi tanjakan tanpa berhenti di bahagian atas cerun",
      "Menaiki tanjakan secara mengundur untuk mengekalkan cengkaman tayar belakang pada cerun konkrit",
      "Memandu secara menyerong merentangi tanjakan untuk mengurangkan bebanan kuasa enjin mendaki",
      "Pandu lurus dalam posisi Drive (D) dengan kawalan pemecut lancar supaya roda hadapan naik dan berhenti"
    ],
    correct_index: 3
  },

  // Class DA Ramp mandatory failure (remove 5-minute time limit claim)
  "quiz-c-da-5:14": {
    question_en: "What action constitutes a Mandatory Failure (Kesalahan Mandatori) during the Class DA Tanjakan (Ramp) circuit test?",
    question_ms: "Apakah tindakan yang menyebabkan Kegagalan Mandatori (gagal serta-merta) semasa ujian litar Tanjakan (Ramp) Kelas DA?",
    options_en: [
      "Taking more than 20 seconds to adjust rear vision mirrors before moving forward up the ramp",
      "Wheels slipping off the ramp sides, overshooting the ramp platform, or vehicle sliding back uncontrollably",
      "Switching on the left turn signal indicator when approaching the base of the ramp incline",
      "Using the right foot exclusively to modulate both the brake and accelerator pedals on the slope"
    ],
    options_ms: [
      "Mengambil masa melebihi 20 saat untuk melaraskan cermin pandang belakang sebelum menaiki tanjakan",
      "Tayar tergelincir keluar dari tebing tanjakan, terlajak melepasi platform, atau kenderaan mengundur tanpa kawalan",
      "Menyalakan lampu isyarat belok ke kiri semasa menghampiri kaki cerun tanjakan tersebut",
      "Menggunakan kaki kanan secara eksklusif untuk mengawal kedua-dua pedal brek dan pemecut di atas cerun"
    ],
    correct_index: 1,
    explanation_en: "Wheels slipping off the ramp edge, uncontrolled vehicle rollback, or overshooting the stop results in immediate failure. (KPP Kelas DA Automatik (2021), KPP02, m/s 248)",
    explanation_ms: "Tayar tergelincir dari tebing tanjakan, kenderaan mengundur tanpa kawalan, atau terlajak berhenti menyebabkan gagal serta-merta. (KPP Kelas DA Automatik (2021), KPP02, m/s 248)"
  },

  // Riding the clutch (remove turns on hazard lights, steering heavier, washer tank)
  "quiz-c-d-2:12": {
    question_en: "Why must you never rest your left foot on the clutch pedal ('riding the clutch') while driving a Class D Manual car?",
    question_ms: "Mengapakah anda dilarang merehatkan kaki kiri di atas pedal cekam ('riding the clutch') semasa memandu kereta manual?",
    options_en: [
      "Slight pressure causes the clutch plate to slip against the flywheel, causing severe overheating and rapid friction wear",
      "Resting the foot on the clutch triggers an automatic electrical disconnect of the engine alternator circuit",
      "It causes engine coolant pressure to surge, blowing the radiator reservoir safety pressure relief valve",
      "Continuous clutch contact forces the manual gearbox gear synchroniser rings to bind and lock into Neutral"
    ],
    options_ms: [
      "Tekanan sedikit menyebabkan piring cekam bergesel dengan roda tenaga, mengakibatkan kepanasan lampau dan kehausan pelapik",
      "Meletakkan kaki pada pedal cekam mematikan litar pengecas alternator enjin secara automatik",
      "Ia mengakibatkan lonjakan tekanan penyejuk enjin lalu merosakkan penutup tangki radiator",
      "Sentuhan berterusan memaksa gelang penyegerak gear kotak gear manual terkunci pada kedudukan Neutral"
    ],
    correct_index: 0
  },

  // Fire hydrant distance (remove painted blue, Sundays)
  "quiz-b-3:6": {
    question_en: "Within what minimum distance from a fire hydrant (Pili Bomba) is parking a motor vehicle strictly prohibited?",
    question_ms: "Dalam jarak minimum berapakah dari pili bomba seseorang dilarang meletakkan kenderaan bermotor?",
    options_en: [
      "Within 1 metre (approximately 3 feet) of a fire hydrant",
      "Within 10 metres (approximately 33 feet) of a fire hydrant",
      "Within 5 metres (approximately 16 feet) of a fire hydrant",
      "Within 3 metres (approximately 10 feet) of a fire hydrant"
    ],
    options_ms: [
      "Dalam jarak 1 meter (kira-kira 3 kaki) dari pili bomba",
      "Dalam jarak 10 meter (kira-kira 33 kaki) dari pili bomba",
      "Dalam jarak 5 meter (kira-kira 16 kaki) dari pili bomba",
      "Dalam jarak 3 meter (kira-kira 10 kaki) dari pili bomba"
    ],
    correct_index: 3
  },

  // 12-Step overtaking Step 1 (remove tailgate within 0.5m, swerve before looking)
  "mock-da-4:29": {
    question_en: "In the KPP Safe Overtaking Procedure, what is the crucial initial consideration before deciding to overtake?",
    question_ms: "Dalam Prosedur Memotong Selamat KPP, apakah pertimbangan awal yang paling penting sebelum membuat keputusan memotong?",
    options_en: [
      "Flash high beam headlights repeatedly and sound the horn continuously for 5 seconds",
      "Verify whether overtaking is truly necessary, legal, and safe while maintaining a safe following distance",
      "Accelerate immediately to expressway speed while still remaining directly behind the lead vehicle",
      "Shift steering wheel quickly into the oncoming lane before checking mirrors to test road space"
    ],
    options_ms: [
      "Menyalakan lampu tinggi berturut-turut dan membunyikan hon secara berterusan selama 5 saat",
      "Menilai sama ada memotong benar-benar perlu, sah di sisi undang-undang, dan selamat sambil mengekalkan jarak mengekor",
      "Memecut serta-merta pada kelajuan lebuh raya semasa masih berada rapat di belakang kenderaan hadapan",
      "Memusing stereng secara pantas ke lorong bertentangan sebelum memeriksa cermin bagi menguji ruang"
    ],
    correct_index: 1
  },
  "mock-d-4:29": {
    question_en: "In the KPP Safe Overtaking Procedure, what is the crucial initial consideration before deciding to overtake?",
    question_ms: "Dalam Prosedur Memotong Selamat KPP, apakah pertimbangan awal yang paling penting sebelum membuat keputusan memotong?",
    options_en: [
      "Flash high beam headlights repeatedly and sound the horn continuously for 5 seconds",
      "Verify whether overtaking is truly necessary, legal, and safe while maintaining a safe following distance",
      "Accelerate immediately to expressway speed while still remaining directly behind the lead vehicle",
      "Shift steering wheel quickly into the oncoming lane before checking mirrors to test road space"
    ],
    options_ms: [
      "Menyalakan lampu tinggi berturut-turut dan membunyikan hon secara berterusan selama 5 saat",
      "Menilai sama ada memotong benar-benar perlu, sah di sisi undang-undang, dan selamat sambil mengekalkan jarak mengekor",
      "Memecut serta-merta pada kelajuan lebuh raya semasa masih berada rapat di belakang kenderaan hadapan",
      "Memusing stereng secara pantas ke lorong bertentangan sebelum memeriksa cermin bagi menguji ruang"
    ],
    correct_index: 1
  }
};

// Apply specific fixes
for (const [key, fix] of Object.entries(SPECIFIC_FIXES)) {
  const [setId, orderIndexStr] = key.split(":");
  const orderIndex = parseInt(orderIndexStr, 10);
  const q = questions.find(item => item.set_id === setId && item.order_index === orderIndex);
  if (q) {
    Object.assign(q, fix);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Clean prefix labels from temporary and mandatory signs
// ─────────────────────────────────────────────────────────────────────────────

for (const q of questions) {
  for (let optIdx = 0; optIdx < 4; optIdx++) {
    let optEn = q.options_en[optIdx];
    let optMs = q.options_ms[optIdx];

    // English prefixes to clean
    optEn = optEn
      .replace(/^Temporary work-zone sign:\s*/i, "")
      .replace(/^Temporary orange diamond sign:\s*/i, "")
      .replace(/^Temporary orange warning:\s*/i, "")
      .replace(/^Temporary orange-and-black chevron board marking a\s*/i, "")
      .replace(/^Temporary orange diamond with exclamation mark:\s*/i, "")
      .replace(/^Temporary orange sign:\s*/i, "")
      .replace(/^Temporary sign:\s*/i, "")
      .replace(/^Mandatory sign:\s*/i, "")
      .replace(/^Mandatory blue circle:\s*/i, "")
      .replace(/^Prohibitory red circle:\s*/i, "")
      .trim();

    // Malay prefixes to clean
    optMs = optMs
      .replace(/^Tanda zon kerja sementara:\s*/i, "")
      .replace(/^Isyarat sementara berlian jingga:\s*/i, "")
      .replace(/^Amaran jingga sementara:\s*/i, "")
      .replace(/^Papan serong sementara jingga-hitam menandakan\s*/i, "")
      .replace(/^Berlian jingga sementara dengan tanda seru:\s*/i, "")
      .replace(/^Tanda sementara jingga:\s*/i, "")
      .replace(/^Tanda sementara:\s*/i, "")
      .replace(/^Tanda wajib:\s*/i, "")
      .replace(/^Bulatan biru wajib:\s*/i, "")
      .replace(/^Bulatan merah larangan:\s*/i, "")
      .trim();

    // Capitalize first character
    q.options_en[optIdx] = optEn.charAt(0).toUpperCase() + optEn.slice(1);
    q.options_ms[optIdx] = optMs.charAt(0).toUpperCase() + optMs.slice(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Strip page numbers, textbook citations, and giveaway arithmetic from questions
// ─────────────────────────────────────────────────────────────────────────────

function cleanQuestionEn(text) {
  let res = text;

  // 1. Parenthetical mentions containing page or m/s or textbook (do this first to eliminate internal commas)
  res = res.replace(/\s*\([^)]*?(?:page|pages|m\/s|halaman)[^)]*?\)/gi, "");

  // 2. Leading clauses that mention page / chapter / textbook / schedule
  res = res.replace(/^(?:According to|Under|In|Based on|On)\s+[^,\?]*?(?:KEJARA|page|pages|m\/s|halaman|textbook|curriculum|General|Chapter)[^,\?]*?,\s*/i, "");
  res = res.replace(/^On page \d+ of [^,]+,\s*/i, "");
  res = res.replace(/^In cornering physics [^,]+,\s*/i, "During vehicle cornering, ");

  // 3. Stray leading Page/M/s leftovers
  res = res.replace(/^(?:Page|Pages|M\/s)\s*[\d\–\-\,\s]+\)?\,?\s*/i, "");

  // 4. "on page 87 of KPP General" / "on page 160"
  res = res.replace(/\s+on page \d+(?: of [^,\?\.]+)?/gi, "");

  // 5. Parenthetical arithmetic giveaways like (9 m reaction distance + 6 m braking distance)
  res = res.replace(/\s*\(\d+\s*m reaction\s*(?:distance)?\s*\+\s*\d+\s*m braking\s*(?:distance)?\)/gi, "");
  res = res.replace(/\s*Based on the dry stopping distance of \d+\s*m \([^\)]+\),\s*/gi, "When a hazard appears ahead on the road, ");

  // Clean trailing/leading spaces and ensure proper question capitalization
  res = res.trim();
  res = res.charAt(0).toUpperCase() + res.slice(1);
  return res;
}

function cleanQuestionMs(text) {
  let res = text;

  // 1. Parenthetical mentions containing page or m/s or textbook (do this first to eliminate internal commas)
  res = res.replace(/\s*\([^)]*?(?:halaman|m\/s|muka surat)[^)]*?\)/gi, "");

  // 2. Leading clauses that mention page / chapter / textbook / schedule
  res = res.replace(/^(?:Berdasarkan|Menurut|Di bawah|Pada|Dalam)\s+[^,\?]*?(?:KEJARA|halaman|m\/s|muka surat|buku teks|kurikulum|General|Bab)[^,\?]*?,\s*/i, "");
  res = res.replace(/^Berdasarkan halaman \d+ buku teks [^,]+,\s*/i, "");
  res = res.replace(/^Dalam fizik [^,]+,\s*/i, "Semasa mengambil selekoh, ");

  // 3. Stray leading Halaman/M/s leftovers
  res = res.replace(/^(?:Halaman|Muka surat|M\/s)\s*[\d\–\-\,\s]+\)?\,?\s*/i, "");

  // 4. "pada halaman 87 buku teks KPP General"
  res = res.replace(/\s+pada halaman \d+(?: buku teks [^,\?\.]+)?/gi, "");

  // 5. Parenthetical arithmetic giveaways
  res = res.replace(/\s*\(\d+\s*m jarak tindak balas\s*\+\s*\d+\s*m jarak membrek\)/gi, "");
  res = res.replace(/\s*Berdasarkan jumlah jarak berhenti kering \d+\s*m \([^\)]+\),\s*/gi, "Sekiranya terdapat halangan di hadapan, ");

  res = res.trim();
  res = res.charAt(0).toUpperCase() + res.slice(1);
  return res;
}

for (const q of questions) {
  q.question_en = cleanQuestionEn(q.question_en);
  q.question_ms = cleanQuestionMs(q.question_ms);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Update manual hill climb citations to PDF page 278
// ─────────────────────────────────────────────────────────────────────────────

for (const q of questions) {
  if (q.source_url && q.source_url.includes("KPP Kelas D Manual") && (q.source_url.includes("219") || q.source_url.includes("224"))) {
    q.source_url = q.source_url.replace(/m\/s\s*(?:219[–\-]223|224[–\-]238)/, "PDF p. 278");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Option Length Balancing (~25% of questions have correct option as longest)
// ─────────────────────────────────────────────────────────────────────────────

const CLAUSES_EN = {
  "road-signs": [
    " with recommended advisory driving speed posted below",
    " where oncoming traffic has priority of movement",
    " requiring steady deceleration before reaching the zone",
    " with a continuous central dividing median barrier",
    " equipped with flashing amber hazard warning signals",
    " requiring selection of a lower transmission ratio",
    " on high-volume single carriageway trunk routes",
    " located within 100 metres before the main roadway junction"
  ],
  "traffic-rules": [
    " unless directed otherwise by an authorised traffic officer",
    " provided the forward roadway is completely unobstructed",
    " while maintaining at least a 2-second safe trailing interval",
    " after verifying mirrors and shoulder blind spot clear",
    " during clear daylight hours on dry tarmac carriageways",
    " within designated municipal urban speed restriction zones",
    " when approaching busy pedestrian priority crossing areas",
    " provided hazard warning lights are activated beforehand"
  ],
  "safety-principles": [
    " before commencing the journey or putting the vehicle in motion",
    " to prevent loss of vehicle control and protect all occupants",
    " during routine pre-drive vehicle inspections and weekly checks",
    " in accordance with manufacturer vehicle service specifications",
    " to minimise mechanical fatigue and avoid unexpected part failure",
    " while maintaining a firm two-handed grip on the steering wheel",
    " to prevent hazardous brake overheating and loss of stopping force",
    " by modulating pedals smoothly and checking dashboard warning gauges"
  ]
};

const CLAUSES_MS = {
  "road-signs": [
    " dengan had kelajuan disyorkan yang dipaparkan di bawah",
    " di mana aliran trafik bertentangan diberi keutamaan jalan",
    " yang memerlukan pengurangan kelajuan sebelum tiba di lokasi",
    " dengan pembahagi jalan konkrit berterusan di hadapan",
    " yang dilengkapi lampu isyarat amaran jingga berkelip",
    " yang memerlukan pemilihan nisbah gear yang lebih rendah",
    " di laluan jalan raya tunggal dengan aliran trafik yang tinggi",
    " dalam jarak 100 meter sebelum tiba di persimpangan jalan"
  ],
  "traffic-rules": [
    " melainkan diarahkan sebaliknya oleh pegawai trafik yang bertugas",
    " dengan syarat laluan hadapan lapang daripada sebarang trafik",
    " sambil mengekalkan jarak mengekor selamat sekurang-kurangnya 2 saat",
    " selepas memeriksa cermin sisi dan titik buta pandangan belakang",
    " semasa waktu siang cerah pada permukaan jalan berturap kering",
    " di dalam zon had laju bandar pihak berkuasa tempatan",
    " apabila menghampiri persimpangan sibuk atau lintasan pejalan kaki",
    " dengan syarat lampu amaran kecemasan dinyalakan terlebih dahulu"
  ],
  "safety-principles": [
    " sebelum memulakan perjalanan atau menggerakkan kenderaan bermotor",
    " bagi mengelakkan kehilangan kawalan kenderaan dan melindungi penumpang",
    " semasa rutin pemeriksaan sebelum memandu dan semakan mingguan",
    " mengikut piawaian spesifikasi penyelenggaraan pengeluar kenderaan",
    " untuk mengurangkan kehausan mekanikal dan mengelakkan kerosakan komponen",
    " sambil memegang stereng dengan kemas menggunakan kedua-dua belah tangan",
    " bagi mengelakkan kepanasan melampau brek dan kehilangan daya cengkaman",
    " dengan mengawal pedal secara lancar dan memantau tolok papan pemuka"
  ]
};

// Targeted fact fixes: claims the books do not support (checked against the PDF text).
const PATCH = {
  "quiz-c-da-4:5": ["RSM", "Rutin Sebelum Memandu (Pre-Driving Cockpit Routine), performed inside the driver's cabin before moving off", "Rutin Sebelum Memandu, iaitu prosedur pemeriksaan dan pelarasan di ruang pemandu sebelum menggerakkan kenderaan"],
};
for (const key of ["quiz-c-da-4:5", "quiz-c-d-4:5"]) {
  const [s, n] = key.split(":");
  const q = questions.find((x) => x.set_id === s && x.order_index === +n);
  q.question_en = "What does the acronym 'RSM' stand for in the KPP02 curriculum?";
  q.question_ms = "Apakah maksud singkatan 'RSM' dalam kurikulum KPP02?";
  q.options_en[q.correct_index] = PATCH["quiz-c-da-4:5"][1];
  q.options_ms[q.correct_index] = PATCH["quiz-c-da-4:5"][2];
  for (let k = 0; k < 4; k++) {
    if (k === q.correct_index) continue;
    q.options_en[k] = q.options_en[k].replace(/, \d+ minutes?.*$/, "");
    q.options_ms[k] = q.options_ms[k].replace(/, \d+ minit.*$/, "");
  }
  q.explanation_en = "RSM is the routine of checking and adjusting everything inside the driver's cabin before the vehicle moves off.";
  q.explanation_ms = "RSM ialah rutin memeriksa dan melaras segala yang ada di ruang pemandu sebelum kenderaan bergerak.";
}
{
  const q = questions.find((x) => x.set_id === "quiz-c-d-6" && x.order_index === 14);
  q.question_en = "In the KPP02 circuit test for Class D Manual, what is the time limit for Side Parking and for the Three-Point Turn?";
  q.question_ms = "Dalam ujian litar KPP02 bagi Kelas D Manual, apakah had masa bagi Parkir Sisi dan Pusingan Tiga Penjuru?";
  q.options_en = ["Side Parking: 1 minute; Three-Point Turn: 30 seconds", "Side Parking: 5 minutes; Three-Point Turn: 3 minutes", "Side Parking: 10 minutes; Three-Point Turn: 5 minutes", "Side Parking: 3 minutes; Three-Point Turn: 5 minutes"];
  q.options_ms = ["Parkir Sisi: 1 minit; Pusingan Tiga Penjuru: 30 saat", "Parkir Sisi: 5 minit; Pusingan Tiga Penjuru: 3 minit", "Parkir Sisi: 10 minit; Pusingan Tiga Penjuru: 5 minit", "Parkir Sisi: 3 minit; Pusingan Tiga Penjuru: 5 minit"];
  q.correct_index = 1;
  q.explanation_en = "Side Parking must be finished within 5 minutes and the Three-Point Turn within 3 minutes.";
  q.explanation_ms = "Parkir Sisi perlu disiapkan dalam 5 minit dan Pusingan Tiga Penjuru dalam 3 minit.";
}
for (const s of ["mock-da-2", "mock-d-2"]) {
  const q = questions.find((x) => x.set_id === s && x.order_index === 31);
  q.question_en = "Why is the road especially slippery at the start of rain after a dry spell?";
  q.question_ms = "Mengapakah jalan sangat licin pada permulaan hujan selepas cuaca kering yang lama?";
}
for (const s of ["mock-da-5", "mock-d-5"]) {
  const q = questions.find((x) => x.set_id === s && x.order_index === 43);
  q.options_en[q.correct_index] = q.options_en[q.correct_index].replace(" at 300 km/h", "");
  q.options_ms[q.correct_index] = q.options_ms[q.correct_index].replace(/ pada 300 km\/j/, "");
}

// Learner-facing text carries no citation: strip "(KPP ..., m/s N)" from explanations.
const CITE = /\s*\(KPP[^()]*(?:\([^()]*\)[^()]*)*\)\s*$/;
const LEAD_EN = /^(?:According to|Under|Based on|In)\s+[^,]*?(?:KPP|m\/s|page)[^,]*(?:\([^)]*\))?[^,]*,\s*/i;
const LEAD_MS = /^(?:Menurut|Berdasarkan|Di bawah|Dalam)\s+[^,]*?(?:KPP|m\/s|halaman)[^,]*(?:\([^)]*\))?[^,]*,\s*/i;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const PAREN = /\s*\([^()]*(?:m\/s|page|halaman)[^()]*\)/gi;
const PAGE_EN = /\bPages?\s+[\d\s&–-]+\s+of\s+KPP\s+(?:Kelas\s+)?[A-Za-z/]+(?:\s+[A-Za-z]+)?(?=\s+(?:cites|states?|explicitly|lists|notes|says|defines))/gi;
const PAGE_MS = /\bHalaman\s+[\d\s&–-]+\s+(?:buku teks\s+)?KPP\s+(?:Kelas\s+)?[A-Za-z/]+(?:\s+[A-Za-z]+)?/gi;
const scrub = (s, lead, page, who) => cap(
  s.replace(CITE, "").replace(PAREN, "").replace(/,\s*m\/s\s*[\d\s,–-]+(?=\))/gi, "")
    .replace(lead, "").replace(page, who)
    .replace(/\bpages?\s+[\d\s&–-]+(?=\s+[a-z])/g, "the textbook").replace(/\bPages?\s+[\d\s&–-]+(?=\s+[a-z])/g, "The textbook")
    .replace(/\bhalaman\s+[\d\s&–-]+/g, "buku teks").replace(/\bHalaman\s+[\d\s&–-]+/g, "Buku teks")
    .trim());
for (const q of questions) {
  q.explanation_en = scrub(q.explanation_en ?? "", LEAD_EN, PAGE_EN, "The textbook");
  q.explanation_ms = scrub(q.explanation_ms ?? "", LEAD_MS, PAGE_MS, "Buku teks");
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. Verify Acceptance Metrics
// ─────────────────────────────────────────────────────────────────────────────

let longestCountEn = 0;
let longestCountMs = 0;
let pageMentionCount = 0;
const pageCheck = /(?:page|pp?\.|p\.)\s*\d+|(?:m\/s|muka surat|halaman)\s*\d+/i;

for (const q of questions) {
  if (pageCheck.test(q.question_en) || pageCheck.test(q.question_ms)) {
    pageMentionCount++;
    console.error(`Page mention remaining in ${q.set_id} #${q.order_index}: EN="${q.question_en}" MS="${q.question_ms}"`);
  }

  const lensEn = q.options_en.map(o => o.length);
  if (lensEn[q.correct_index] === Math.max(...lensEn)) {
    longestCountEn++;
  }

  const lensMs = q.options_ms.map(o => o.length);
  if (lensMs[q.correct_index] === Math.max(...lensMs)) {
    longestCountMs++;
  }
}

const pctEn = (longestCountEn / questions.length * 100).toFixed(2);
const pctMs = (longestCountMs / questions.length * 100).toFixed(2);

console.log(`Page mentions in questions: ${pageMentionCount}`);
console.log(`Correct option longest in EN: ${longestCountEn} / ${questions.length} (${pctEn}%)`);
console.log(`Correct option longest in MS: ${longestCountMs} / ${questions.length} (${pctMs}%)`);

if (pageMentionCount > 0) {
  throw new Error(`Found ${pageMentionCount} questions still mentioning pages!`);
}

if (parseFloat(pctEn) > 28 || parseFloat(pctMs) > 28) {
  throw new Error(`Option length bias too high: EN ${pctEn}%, MS ${pctMs}%`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Write updated scripts/questions-kpp-textbook.js
// ─────────────────────────────────────────────────────────────────────────────

const fileHeader = `/**
 * DriveMy — Official JPJ KPP01 Textbook Question Sets (EN/BM)
 * Generated from KPP_General.pdf, KPP_DA_Auto.pdf, and KPP_D_Manual.pdf
 * Contains 30 sets (1,020 rows) across Bahagian A, Bahagian B, and Bahagian C (DA & D).
 */

export const KPP_TEXTBOOK_QUESTIONS = ${JSON.stringify(questions, null, 2)};
`;

const jsPath = resolve(__dirname, "questions-kpp-textbook.js");
writeFileSync(jsPath, fileHeader, "utf8");
console.log(`Successfully wrote ${questions.length} questions to ${jsPath}`);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Regenerate supabase/migrations/20261108000100_kpp_textbook_question_bank.sql
// ─────────────────────────────────────────────────────────────────────────────

function sqlEscape(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + str.replace(/'/g, "''") + "'";
}

const sqlRows = questions.map(q => {
  const idSql = `'${q.id}'::uuid`;
  const catSql = sqlEscape(q.category);
  const setSql = sqlEscape(q.set_id);
  const orderSql = q.order_index;
  const qEnSql = sqlEscape(q.question_en);
  const qMsSql = sqlEscape(q.question_ms);
  const optEnJson = sqlEscape(JSON.stringify(q.options_en)) + "::jsonb";
  const optMsJson = sqlEscape(JSON.stringify(q.options_ms)) + "::jsonb";
  const corrSql = q.correct_index;
  const expEnSql = sqlEscape(q.explanation_en);
  const expMsSql = sqlEscape(q.explanation_ms);
  const imgSql = sqlEscape(q.image_url);
  const srcSql = sqlEscape(q.source_url);

  return `  (${idSql}, ${catSql}, ${setSql}, ${orderSql}, ${qEnSql}, ${qMsSql}, ${optEnJson}, ${optMsJson}, ${corrSql}, ${expEnSql}, ${expMsSql}, ${imgSql}, ${srcSql})`;
});

const migrationSql = `-- =============================================================================
-- Official JPJ KPP01 Textbook Question Bank Migration (EN / BM)
--
-- 1. Preserves all legacy question sets ('mock-1', 'mock-2', 'mock-3', 'quiz-pool')
--    so learners' historical mock_test_results and quiz_results review cleanly.
-- 2. Inserts 30 new textbook-grounded question sets (1,020 rows):
--    - Bahagian A Practice Sets: quiz-a-1 .. quiz-a-6 (6 x 15 = 90 questions)
--    - Bahagian B Practice Sets: quiz-b-1 .. quiz-b-6 (6 x 25 = 150 questions)
--    - Bahagian C Practice Sets (Class DA Auto): quiz-c-da-1 .. quiz-c-da-6 (6 x 15 = 90 questions)
--    - Bahagian C Practice Sets (Class D Manual): quiz-c-d-1 .. quiz-c-d-6 (6 x 15 = 90 questions)
--    - Class DA Automatic Mock Sets: mock-da-1 .. mock-da-6 (6 x 50 = 300 questions)
--    - Class D Manual Mock Sets: mock-d-1 .. mock-d-6 (6 x 50 = 300 questions)
-- 3. Updates public.kpp_practice_questions view to expose all practice sets (set_id LIKE 'quiz-%').
-- 4. Updates public.recompute_exam_score() trigger to accept both legacy and new textbook sets.
-- =============================================================================

INSERT INTO public.kpp_questions (
  id, category, set_id, order_index,
  question_en, question_ms, options_en, options_ms,
  correct_index, explanation_en, explanation_ms,
  image_url, source_url
) VALUES
${sqlRows.join(",\n")}
ON CONFLICT (set_id, order_index) DO UPDATE SET
  category = EXCLUDED.category,
  question_en = EXCLUDED.question_en,
  question_ms = EXCLUDED.question_ms,
  options_en = EXCLUDED.options_en,
  options_ms = EXCLUDED.options_ms,
  correct_index = EXCLUDED.correct_index,
  explanation_en = EXCLUDED.explanation_en,
  explanation_ms = EXCLUDED.explanation_ms,
  image_url = EXCLUDED.image_url,
  source_url = EXCLUDED.source_url;

-- ─── Update Secure Practice View to Include All Practice Sets (quiz-*) ─────
CREATE OR REPLACE VIEW public.kpp_practice_questions
WITH (security_invoker = false, security_barrier = true)
AS
  SELECT
    id,
    category,
    set_id,
    order_index,
    question_en,
    question_ms,
    options_en,
    options_ms,
    correct_index,
    explanation_en,
    explanation_ms,
    image_url,
    source_url,
    created_at
  FROM public.kpp_questions
  WHERE set_id = 'quiz-pool' OR set_id LIKE 'quiz-%';

GRANT SELECT ON public.kpp_practice_questions TO authenticated, anon;

-- ─── Update Authoritative Score Recompute Trigger for New Set IDs ─────────
CREATE OR REPLACE FUNCTION public.recompute_exam_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_score integer := 0;
  v_total integer;
  v_q_id_text text;
  v_sel_idx_text text;
  v_q_uuid uuid;
  v_sel_idx integer;
  v_correct integer;
  v_set text;
  v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NEW.answers IS NULL OR jsonb_typeof(NEW.answers) <> 'object' THEN
    RAISE EXCEPTION 'Answers must be a JSON object' USING ERRCODE = '22023';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify result owner' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'mock_test_results' THEN
    IF NEW.set_id IS NULL OR NEW.set_id NOT IN (
      'mock-1', 'mock-2', 'mock-3',
      'mock-da-1', 'mock-da-2', 'mock-da-3', 'mock-da-4', 'mock-da-5', 'mock-da-6',
      'mock-d-1', 'mock-d-2', 'mock-d-3', 'mock-d-4', 'mock-d-5', 'mock-d-6'
    ) THEN
      RAISE EXCEPTION 'Invalid mock set_id' USING ERRCODE = '22023';
    END IF;
    SELECT count(*) INTO v_total FROM public.kpp_questions WHERE set_id = NEW.set_id;
    IF v_total = 0 THEN
      RAISE EXCEPTION 'Empty mock set' USING ERRCODE = '22023';
    END IF;
  ELSIF TG_TABLE_NAME = 'quiz_results' THEN
    v_total := cardinality(NEW.question_ids);
    IF v_total IS NULL OR v_total = 0 OR v_total <> (
      SELECT count(DISTINCT id) FROM unnest(NEW.question_ids) AS selection(id)
    ) THEN
      RAISE EXCEPTION 'Quiz selection must be nonempty and distinct' USING ERRCODE = '22023';
    END IF;
    IF v_total <> (
      SELECT count(*) FROM public.kpp_questions
      WHERE id = ANY(NEW.question_ids) AND (set_id = 'quiz-pool' OR set_id LIKE 'quiz-%')
    ) THEN
      RAISE EXCEPTION 'Quiz selection must belong to the practice pool' USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported grading table' USING ERRCODE = '22023';
  END IF;

  FOR v_q_id_text, v_sel_idx_text IN SELECT key, value FROM jsonb_each_text(NEW.answers) LOOP
    BEGIN
      v_q_uuid := v_q_id_text::uuid;
      v_sel_idx := v_sel_idx_text::integer;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Malformed question UUID or answer index' USING ERRCODE = '22023';
    END;
    IF v_q_uuid = ANY(v_seen) THEN
      RAISE EXCEPTION 'Duplicate parsed question UUID' USING ERRCODE = '22023';
    END IF;
    v_seen := array_append(v_seen, v_q_uuid);
    IF v_sel_idx IS NULL OR v_sel_idx < 0 OR v_sel_idx > 3 THEN
      RAISE EXCEPTION 'Impossible answer option index' USING ERRCODE = '22023';
    END IF;
    SELECT correct_index, set_id INTO v_correct, v_set
    FROM public.kpp_questions WHERE id = v_q_uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unknown question ID' USING ERRCODE = '22023';
    END IF;
    IF TG_TABLE_NAME = 'mock_test_results' THEN
      IF v_set <> NEW.set_id THEN
        RAISE EXCEPTION 'Foreign-set answer' USING ERRCODE = '22023';
      END IF;
    ELSIF NOT (v_q_uuid = ANY(NEW.question_ids)) THEN
      RAISE EXCEPTION 'Undeclared quiz answer' USING ERRCODE = '22023';
    END IF;
    IF v_sel_idx = v_correct THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  NEW.total_questions := v_total;
  NEW.score := v_score;
  NEW.percentage := round(100 * v_score::numeric / v_total, 2);
  IF TG_TABLE_NAME = 'mock_test_results' THEN
    NEW.passed := NEW.percentage >= 84;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_exam_score() FROM PUBLIC, anon, authenticated;
`;

const migrationPath = resolve(ROOT, "supabase/migrations/20261108000100_kpp_textbook_question_bank.sql");
writeFileSync(migrationPath, migrationSql, "utf8");
console.log(`Successfully generated migration file: ${migrationPath}`);
