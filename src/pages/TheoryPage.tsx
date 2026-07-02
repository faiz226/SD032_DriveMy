import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, Repeat, CheckCircle2, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useLanguage } from '@/hooks/useLanguage';

// ── Regulatory / Prohibitory – vector renders, confirmed correct by browser audit
import imgStop        from '@/assets/signs/svg/stop.png';          
import imgNoUTurnAsset from '@/assets/signs/svg/no-entry.png';       // Actually No U-Turn
import imgHeightLimit  from '@/assets/signs/svg/no-uturn.png';       // Actually 5.0m Height Limit
import imgNoEntryAsset from '@/assets/signs/svg/no-right-turn.png';  // Actually No Entry
import imgWeightLimit  from '@/assets/signs/svg/no-left-turn.png';   // Actually 8T Weight Limit
import imgEndRestrict  from '@/assets/signs/svg/no-parking.png';     // Actually End of Restriction
import imgNoParkingAsset from '@/assets/signs/svg/no-stopping.png';  // Actually No Parking
import imgNoHorn      from '@/assets/signs/svg/no-horn.png';        
import imgSpeed60     from '@/assets/signs/svg/speed-60.png';

// ── Warning Signs – confirmed correct by browser audit
import imgSlippery   from '@/assets/signs/real/slippery.jpg';            // W512 – yellow diamond, skidding car
import imgJunction   from '@/assets/signs/real/junction.jpg';            // W502 – yellow diamond, T-junction
import imgSchool     from '@/assets/signs/real/school-zone.jpg';         // W523 – yellow diamond, schoolchildren

// ── Informational (confirmed correct by browser)
import imgInfo from '@/assets/signs/real/info.jpg';  // blue rectangular sign with 'H' (Hospital)

// ─────────────────────────────────────────────────────────────────────────────
// ROAD SIGNS DATA  (every image verified against caption by browser audit)
// ─────────────────────────────────────────────────────────────────────────────
const roadSigns = [
  // ── Regulatory (Prohibitory) – all use svg/ vector PNGs confirmed correct
  { id: 'stop',        name: 'Stop',               nameMs: 'Berhenti',                desc: 'Come to a complete stop before the stop line. Do not proceed until safe.',           descMs: 'Berhenti sepenuhnya sebelum garisan henti. Jangan maju sehingga selamat.',    type: 'Regulatory', img: imgStop },
  { id: 'no-uturn',    name: 'No U-Turn',           nameMs: 'Dilarang Pusingan U',     desc: 'Making a U-turn is strictly prohibited at this location.',                          descMs: 'Pusingan U dilarang di lokasi ini.',                                           type: 'Regulatory', img: imgNoUTurnAsset },
  { id: 'height-limit',name: 'Height Limit 5.0m',   nameMs: 'Had Ketinggian 5.0m',     desc: 'Vehicles exceeding 5.0 metres in height are prohibited from passing.',              descMs: 'Kenderaan yang melebihi ketinggian 5.0 meter dilarang lalu.',                  type: 'Regulatory', img: imgHeightLimit },
  { id: 'no-entry',    name: 'No Entry',            nameMs: 'Dilarang Masuk',          desc: 'Entry is prohibited for all vehicles. Usually placed on one-way or exit roads.',    descMs: 'Semua kenderaan dilarang masuk. Biasanya di jalan sehala atau jalan keluar.',  type: 'Regulatory', img: imgNoEntryAsset },
  { id: 'weight-limit',name: 'Weight Limit 8T',     nameMs: 'Had Berat 8T',            desc: 'Vehicles exceeding 8 tonnes laden weight are prohibited from passing.',             descMs: 'Kenderaan bermuatan melebihi 8 tan dilarang masuk.',                           type: 'Regulatory', img: imgWeightLimit },
  { id: 'end-restrict',name: 'End of Restriction',  nameMs: 'Tamat Had Laju',          desc: 'National speed limit applies. Previous restrictions end.',                          descMs: 'Had laju kebangsaan digunakan. Sekatan sebelum ini ditamatkan.',               type: 'Regulatory', img: imgEndRestrict },
  { id: 'no-parking',  name: 'No Parking',          nameMs: 'Dilarang Letak Kereta',   desc: 'Parking is prohibited. Brief stops for pick-up/drop-off may be permitted.',         descMs: 'Letak kereta dilarang. Berhenti sebentar untuk naik/turun mungkin dibenarkan.', type: 'Regulatory', img: imgNoParkingAsset },
  { id: 'no-horn',     name: 'No Sounding of Horn', nameMs: 'Dilarang Membunyikan Hon', desc: 'Sounding vehicle horn is prohibited. Common near hospitals and schools.',         descMs: 'Membunyikan hon kenderaan dilarang. Biasa di kawasan hospital dan sekolah.',   type: 'Regulatory', img: imgNoHorn },
  { id: 'speed-60',    name: 'Speed Limit 60',      nameMs: 'Had Laju 60',             desc: 'Maximum speed is 60 km/h. An offence under Section 59 of Road Transport Act 1987.', descMs: 'Laju maksimum ialah 60 km/j. Kesalahan di bawah Seksyen 59 Akta Pengangkutan Jalan 1987.', type: 'Regulatory', img: imgSpeed60 },

  // ── Warning – yellow diamond signs (browser-confirmed correct assets only)
  { id: 'slippery',    name: 'Slippery Road',       nameMs: 'Jalan Licin',             desc: 'Road surface may be slippery. Reduce speed and increase following distance.',       descMs: 'Permukaan jalan mungkin licin. Kurangkan laju dan tingkatkan jarak ikutan.',   type: 'Warning',    img: imgSlippery },
  { id: 'junction',    name: 'T-Junction Ahead',    nameMs: 'Simpang T di Hadapan',    desc: 'T-junction ahead. Be ready to yield or stop for crossing traffic.',               descMs: 'Simpang T di hadapan. Sedia untuk beri laluan atau berhenti bagi trafik.',     type: 'Warning',    img: imgJunction },
  { id: 'school',      name: 'School Zone',         nameMs: 'Zon Sekolah',             desc: 'School zone. Limit 30 km/h during school hours. Watch for children crossing.',    descMs: 'Zon sekolah. Had laju 30 km/j semasa waktu sekolah. Awasi kanak-kanak.',       type: 'Warning',    img: imgSchool },

  // ── Informational
  { id: 'info',        name: 'Hospital Nearby',     nameMs: 'Hospital Berhampiran',    desc: 'Hospital facility nearby. Keep noise low and avoid sounding horn in this area.',   descMs: 'Hospital berhampiran. Jaga kebisingan dan elakkan membunyikan hon di kawasan ini.', type: 'Informational', img: imgInfo },
];



// ─────────────────────────────────────────────────────────────────────────────
// TRAFFIC RULES  (Road Transport Act 1987 & Malaysian Highway Code)
// ─────────────────────────────────────────────────────────────────────────────
const trafficRules = [
  {
    id: 'speed-limits', title: 'Speed Limits', titleMs: 'Had Laju',
    content: 'Expressway/Highway: 110 km/h max. Federal roads: 90 km/h. State roads: 80 km/h. Built-up areas: 50–60 km/h. School zones: 30 km/h. Exceeding limits is a compound offence under Section 59 of the Road Transport Act 1987.',
    contentMs: 'Lebuh raya: 110 km/j. Jalan persekutuan: 90 km/j. Jalan negeri: 80 km/j. Kawasan bandar: 50–60 km/j. Zon sekolah: 30 km/j. Melebihi had laju adalah kesalahan kompaun di bawah Seksyen 59 Akta Pengangkutan Jalan 1987.',
  },
  {
    id: 'right-of-way', title: 'Right of Way', titleMs: 'Hak Laluan',
    content: 'Vehicles on the main road always have priority. Vehicles entering from a side road must yield. At a roundabout, vehicles already circulating have right of way. Emergency vehicles (ambulance, fire engine, police) always have priority — pull left and stop.',
    contentMs: 'Kenderaan di jalan utama sentiasa mendapat keutamaan. Kenderaan masuk dari jalan sisi mesti beri laluan. Di bulatan, kenderaan yang sedang beredar mempunyai keutamaan. Kenderaan kecemasan (ambulans, bomba, polis) sentiasa mendapat keutamaan — ke kiri dan berhenti.',
  },
  {
    id: 'overtaking', title: 'Rules on Overtaking', titleMs: 'Peraturan Memotong',
    content: 'Overtake only on the RIGHT side. Never overtake: on double solid white lines, within 30 m of a junction, on a bend or hill crest, at a pedestrian crossing, or in a school zone. Signal, check mirrors and blind spots before overtaking.',
    contentMs: 'Memotong hanya di sebelah KANAN. Jangan memotong: pada garisan putih berkembar berterusan, dalam 30 m dari persimpangan, di selekoh atau puncak bukit, di lintasan pejalan kaki, atau di zon sekolah. Isyarat, semak cermin dan titik buta sebelum memotong.',
  },
  {
    id: 'lane-discipline', title: 'Lane Discipline', titleMs: 'Disiplin Lorong',
    content: 'Keep left unless overtaking. Heavy vehicles must use the leftmost lane on expressways. Lane markings: broken white lines = may cross; solid white line = do not cross; double solid yellow = absolutely no crossing. Bus lanes are reserved during operating hours.',
    contentMs: 'Ikut kiri kecuali memotong. Kenderaan berat mesti menggunakan lorong paling kiri di lebuh raya. Garisan jalan: garisan putih terputus = boleh melintas; garisan putih padu = tidak boleh melintas; garisan kuning berkembar = tidak boleh melintas sama sekali.',
  },
  {
    id: 'traffic-lights', title: 'Traffic Light Rules', titleMs: 'Peraturan Lampu Isyarat',
    content: 'RED: Stop completely behind the stop line. AMBER: Stop if safe; clear the junction only if already crossing. GREEN: Proceed if clear — always check for red-light runners. Flashing amber: proceed with caution. Flashing red: treat as a stop sign.',
    contentMs: 'MERAH: Berhenti sepenuhnya di belakang garisan henti. AMBER: Berhenti jika selamat; lepasi persimpangan hanya jika sudah melintas. HIJAU: Maju jika laluan clear. Amber berkedip: maju dengan berhati-hati. Merah berkedip: anggap seperti papan tanda berhenti.',
  },
  {
    id: 'pedestrian-rules', title: 'Pedestrian & Crossing Rules', titleMs: 'Peraturan Pejalan Kaki & Lintasan',
    content: 'You MUST give way to pedestrians at zebra crossings — failure is an offence (RM300 fine). At pelican/toucan crossings, stop on red. Do not park within 15 m of a pedestrian crossing. Reduce to 30 km/h near schools during school hours.',
    contentMs: 'Anda WAJIB memberi laluan kepada pejalan kaki di lintasan zebra — kegagalan adalah kesalahan (denda RM300). Di lintasan pelikan/toucan, berhenti apabila merah. Jangan letak kereta dalam 15 m dari lintasan pejalan kaki.',
  },
  {
    id: 'seat-belt', title: 'Seat Belt & Child Restraints', titleMs: 'Tali Pinggang & Tempat Duduk Kanak-kanak',
    content: 'All occupants must wear seat belts. Children under 1 year OR below 9 kg must use a rear-facing child seat. Children 1–4 years (9–18 kg) use a forward-facing child seat. Children 4–11 years (18–36 kg) must use a booster seat. Fine: RM300–RM2,000.',
    contentMs: 'Semua penumpang wajib memakai tali pinggang keselamatan. Kanak-kanak bawah 1 tahun atau bawah 9 kg mesti menggunakan tempat duduk bayi menghadap belakang. Denda: RM300–RM2,000.',
  },
  {
    id: 'roundabout-rules', title: 'Roundabout Rules', titleMs: 'Peraturan Bulatan',
    content: 'Give way to vehicles already in the roundabout. Signal LEFT when exiting. Travel anti-clockwise (Malaysian rule). At multi-lane roundabouts, stay in your lane throughout. Do not change lanes inside a roundabout. Emergency vehicles have absolute priority.',
    contentMs: 'Beri laluan kepada kenderaan yang sudah berada dalam bulatan. Isyarat KIRI semasa keluar. Bergerak mengikut arah lawan jam (peraturan Malaysia). Di bulatan berbilang lorong, kekal di lorong anda sepanjang masa.',
  },
  {
    id: 'mobile-phone', title: 'Mobile Phone Use', titleMs: 'Penggunaan Telefon Bimbit',
    content: 'Using a handheld mobile phone while driving is illegal under Section 79B of Road Transport Act 1987. Fine: RM1,000–RM2,000 (1st offence) or up to 6 months imprisonment. Hands-free kits are permitted but still increase cognitive distraction.',
    contentMs: 'Menggunakan telefon bimbit genggam semasa memandu adalah haram di bawah Seksyen 79B Akta Pengangkutan Jalan 1987. Denda: RM1,000–RM2,000 (kesalahan pertama) atau penjara sehingga 6 bulan.',
  },
  {
    id: 'drink-driving', title: 'Drink & Drug Driving', titleMs: 'Memandu Dalam Keadaan Mabuk',
    content: 'Legal blood alcohol limit in Malaysia: 80 mg/100 mL (same as UK). Zero-tolerance for drug impairment. Penalty: RM1,000–RM6,000 fine AND/OR up to 12 months imprisonment. Licence suspension mandatory on conviction. Second offence: RM2,000–RM10,000 and/or 2 years jail.',
    contentMs: 'Had alkohol dalam darah di Malaysia: 80 mg/100 mL. Tiada toleransi untuk penggunaan dadah. Hukuman: Denda RM1,000–RM6,000 DAN/ATAU penjara hingga 12 bulan. Lesen digantung secara mandatori.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROAD SAFETY  (JPJ & MIROS guidelines)
// ─────────────────────────────────────────────────────────────────────────────
const safetyPrinciples = [
  {
    id: 'defensive', title: 'Defensive Driving', titleMs: 'Pemanduan Defensif',
    content: 'Anticipate hazards before they happen. Scan 12–15 seconds ahead on highways, 4–6 seconds in town. Maintain a 2-second gap (3 seconds in rain). Never assume other drivers will act correctly.',
    contentMs: 'Jangka bahaya sebelum berlaku. Imbas 12–15 saat ke hadapan di lebuh raya, 4–6 saat di bandar. Kekalkan jarak 2 saat (3 saat dalam hujan). Jangan anggap pemandu lain akan bertindak betul.',
  },
  {
    id: 'mirrors', title: 'Mirror & Blind Spot Checks', titleMs: 'Semakan Cermin & Titik Buta',
    content: 'Check mirrors every 5–8 seconds. Before changing lanes: signal → check mirrors → check blind spot over shoulder → move. Adjust mirrors so you can see the rear quarters of your car. Convex mirrors show wider view but objects are closer than they appear.',
    contentMs: 'Semak cermin setiap 5–8 saat. Sebelum tukar lorong: isyarat → semak cermin → semak titik buta → bergerak. Laraskan cermin supaya anda boleh melihat bahagian belakang sisi kereta anda.',
  },
  {
    id: 'fatigue', title: 'Fatigue & Drowsy Driving', titleMs: 'Keletihan & Mengantuk Semasa Memandu',
    content: 'Drowsy driving kills. On long journeys, rest every 2 hours or 200 km (KPM guideline). Take a 15–20 minute nap at a Rest & Service Area if sleepy. Signs of fatigue: yawning, blurred vision, drifting lanes, missing exits. Never rely on coffee alone.',
    contentMs: 'Mengantuk membunuh. Dalam perjalanan jauh, rehat setiap 2 jam atau 200 km (garis panduan KPM). Tidur 15–20 minit di Kawasan Rehat & Servis jika mengantuk. Tanda keletihan: menguap, penglihatan kabur, tersasar lorong.',
  },
  {
    id: 'night', title: 'Night Driving', titleMs: 'Pemanduan Malam',
    content: 'Use headlights from sunset to sunrise (approximately 7 pm–7 am). Dip (low beam) for oncoming traffic within 150 m. Never flash high-beams as a weapon. Reduce speed by 20–30% at night. Keep windscreen clean to reduce glare.',
    contentMs: 'Gunakan lampu utama dari matahari terbenam hingga matahari terbit (lebih kurang 7 malam–7 pagi). Rendahkan lampu untuk trafik bertentangan dalam 150 m. Kurangkan laju 20–30% pada waktu malam.',
  },
  {
    id: 'rain', title: 'Driving in Rain', titleMs: 'Memandu Dalam Hujan',
    content: 'Reduce speed by at least 30% in heavy rain. Turn on headlights (not hazard lights). Increase following distance to 4 seconds. Avoid sudden braking — brake gently early. Watch for flash floods on low-lying roads. If aquaplaning: release accelerator gently, do NOT brake hard.',
    contentMs: 'Kurangkan laju sekurang-kurangnya 30% dalam hujan lebat. Hidupkan lampu utama (bukan lampu hazard). Tingkatkan jarak ikutan kepada 4 saat. Elakkan brek mengejut. Jika aquaplaning: lepaskan pemecut perlahan-lahan, JANGAN brek kuat.',
  },
  {
    id: 'breakdown', title: 'Breakdowns & Emergencies', titleMs: 'Kerosakan & Kecemasan',
    content: 'If your vehicle breaks down: activate hazard lights immediately. Move off the road if possible. Place warning triangle 45 m behind the vehicle (highway: 100 m). Stay behind the barrier — never stand behind the car on a highway. Call PLUS/LLM/1800-88-0000 for highway assistance.',
    contentMs: 'Jika kenderaan rosak: hidupkan lampu hazard dengan segera. Pindahkan ke tepi jalan jika boleh. Letakkan segi tiga amaran 45 m di belakang (lebuh raya: 100 m). Hubungi PLUS/LLM/1800-88-0000 untuk bantuan lebuh raya.',
  },
  {
    id: 'tailgating', title: 'Following Distance', titleMs: 'Jarak Mengikut',
    content: 'The 2-second rule: pick a fixed point ahead; your vehicle should pass it at least 2 seconds after the vehicle in front. Double to 4 seconds in rain. Triple to 6+ seconds for motorcycles and heavy vehicles. In Malaysian conditions (frequent sudden braking), more is always safer.',
    contentMs: 'Peraturan 2 saat: pilih titik tetap di hadapan; kenderaan anda perlu melaluinya sekurang-kurangnya 2 saat selepas kenderaan di hadapan. Gandakan kepada 4 saat dalam hujan.',
  },
  {
    id: 'tyres', title: 'Tyre Safety', titleMs: 'Keselamatan Tayar',
    content: 'Check tyre pressure monthly (when cold). Legal minimum tread depth in Malaysia: 1.6 mm. Recommended: 3 mm. Under-inflated tyres increase fuel use by 5% and braking distance by 20%. Rotate tyres every 10,000 km. Inspect for cuts, bulges, and uneven wear regularly.',
    contentMs: 'Semak tekanan tayar setiap bulan (ketika sejuk). Kedalaman alur minimum sah di Malaysia: 1.6 mm. Disyorkan: 3 mm. Tayar kurang angin meningkatkan penggunaan bahan api 5% dan jarak brek 20%.',
  },
];


export function TheoryPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'bm';
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setBookmarks((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSigns = useMemo(() => {
    return roadSigns.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameMs.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const categories = ['Regulatory', 'Warning', 'Informational'];

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'Regulatory': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Warning': return 'bg-warning/10 border-warning/20 text-yellow-700';
      case 'Informational': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Sticky Quick Navigation Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b shadow-sm pt-4 px-4 md:px-8 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">Theory Learning</h1>
            <p className="text-sm text-muted-foreground">Interactive road rules and signs guide.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder={lang === 'en' ? "Search topics..." : "Cari topik..."}
                className="w-full h-10 pl-9 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6">
        <Tabs defaultValue="signs">
          <div className="sticky top-[73px] sm:top-[73px] z-10 bg-background/95 backdrop-blur py-2 -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="w-full sm:w-auto overflow-x-auto justify-start inline-flex flex-nowrap hide-scrollbar">
              <TabsTrigger value="signs">{lang === 'en' ? 'Road Signs' : 'Papan Tanda'}</TabsTrigger>
              <TabsTrigger value="rules">{lang === 'en' ? 'Traffic Rules' : 'Undang-undang'}</TabsTrigger>
              <TabsTrigger value="safety">{lang === 'en' ? 'Safety' : 'Keselamatan'}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="signs" className="mt-4 space-y-10">
            {categories.map((category) => {
              const categorySigns = filteredSigns.filter(s => s.type === category);
              if (categorySigns.length === 0) return null;

              const masteredCount = categorySigns.filter(s => flipped[s.id]).length;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-heading">{category} Signs</h2>
                      <Badge className={getCategoryColor(category)} variant="outline">{categorySigns.length}</Badge>
                    </div>
                    {/* Progress Ring */}
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">
                         {masteredCount}/{categorySigns.length} {lang === 'en' ? 'mastered' : 'dikuasai'}
                       </span>
                       <div className="relative w-8 h-8">
                         <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                           <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="4" />
                           <circle
                             cx="18" cy="18" r="16" fill="none"
                             className="stroke-primary" strokeWidth="4"
                             strokeDasharray={`${(masteredCount / categorySigns.length) * 100}, 100`}
                             strokeLinecap="round"
                           />
                         </svg>
                       </div>
                    </div>
                  </div>

                  {/* Horizontal swipeable row on mobile, grid on desktop */}
                  <div className="flex overflow-x-auto snap-x snap-mandatory py-4 -mt-4 gap-4 md:grid md:grid-cols-2 lg:grid-cols-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
                    {categorySigns.map((sign) => (
                      <div
                        key={sign.id}
                        className="relative min-w-[240px] w-[70vw] md:w-auto md:min-w-0 snap-center h-[280px] perspective-1000 cursor-pointer group"
                        onClick={() => toggleFlip(sign.id)}
                      >
                        <div className={`w-full h-full transition-transform duration-700 ease-out-quart transform-style-3d ${flipped[sign.id] ? 'rotate-y-180' : 'group-hover:-translate-y-2 group-hover:shadow-xl rounded-xl'}`}>
                          {/* Front */}
                          <Card className="rounded-xl border-border/60 text-card-foreground duration-300 hover:shadow-lg absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-card border hover:border-primary/50 transition-colors shadow-sm overflow-hidden">
                            <button
                              onClick={(e) => toggleBookmark(e, sign.id)}
                              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors hover:scale-110 active:scale-95 duration-200"
                              aria-label="Bookmark sign"
                            >
                              <Star className={`w-4 h-4 ${bookmarks.includes(sign.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} aria-hidden="true" />
                            </button>
                            <div className="w-full flex-1 flex items-center justify-center p-6 bg-muted/10 transition-colors duration-300 group-hover:bg-muted/30">
                              <img src={sign.img} alt={sign.name} className="max-w-[130px] max-h-[130px] object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500 ease-out-back" loading="lazy" />
                            </div>
                            <div className="w-full p-4 border-t bg-background/95 backdrop-blur flex items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors duration-300">
                              <span className="text-sm font-semibold text-primary">{lang === 'en' ? 'Tap to reveal' : 'Ketik untuk jawapan'}</span>
                              <Repeat className="w-4 h-4 text-primary group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                            </div>
                          </Card>

                          {/* Back */}
                          <Card className="rounded-xl border border-border/60 transition-all duration-300 hover:shadow-lg absolute inset-0 backface-hidden rotate-y-180 flex flex-col bg-primary text-primary-foreground border-none p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none transition-colors">
                                {category}
                              </Badge>
                              <CheckCircle2 className="w-5 h-5 text-green-300" aria-hidden="true" />
                            </div>
                            <h3 className="font-heading font-bold text-xl mb-2 text-primary-foreground">{lang === 'en' ? sign.name : sign.nameMs}</h3>
                            <p className="text-sm leading-relaxed text-primary-foreground/90 overflow-y-auto pr-1">
                              {lang === 'en' ? sign.desc : sign.descMs}
                            </p>
                            <div className="mt-auto pt-4 flex items-center justify-center gap-2 text-xs font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200">
                              <Repeat className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" aria-hidden="true" /> {lang === 'en' ? 'Tap to flip back' : 'Ketik untuk pusing'}
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mini-Quiz injected at the end of each category */}
                  <div className="mt-4 p-5 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent fill-accent" aria-hidden="true" />
                        {lang === 'en' ? `Knowledge Check: ${category}` : `Uji Minda: ${category}`}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lang === 'en' ? 'Test your memory on these signs before moving on.' : 'Uji ingatan anda tentang papan tanda ini.'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(ROUTES.QUIZ)}
                      className="shrink-0 h-10 px-6 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      {lang === 'en' ? 'Quick Practice' : 'Latihan Pantas'} <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <div className="space-y-4 max-w-3xl">
              {trafficRules.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.titleMs.toLowerCase().includes(search.toLowerCase())).map((rule) => (
                <Card key={rule.id} className="border hover:border-primary/30 transition-colors shadow-sm">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="font-heading font-bold text-lg text-primary">{lang === 'en' ? rule.title : rule.titleMs}</h3>
                    <p className="text-base text-foreground/80 mt-3 leading-relaxed">
                      {lang === 'en' ? rule.content : rule.contentMs}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="safety" className="mt-4">
            <div className="space-y-4 max-w-3xl">
              {safetyPrinciples.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.titleMs.toLowerCase().includes(search.toLowerCase())).map((p) => (
                <Card key={p.id} className="border hover:border-primary/30 transition-colors shadow-sm">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="font-heading font-bold text-lg text-primary">{lang === 'en' ? p.title : p.titleMs}</h3>
                    <p className="text-base text-foreground/80 mt-3 leading-relaxed">
                      {lang === 'en' ? p.content : p.contentMs}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
