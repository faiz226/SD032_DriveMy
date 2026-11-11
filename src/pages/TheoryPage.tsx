import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowsClockwise as Repeat,
  CaretRight as ChevronRight,
  Check,
  MagnifyingGlass as Search,
  Star,
  X,
} from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthStore } from "@/stores/authStore";
import { useTheoryProgressRows, useUpdateTheoryProgress } from "@/hooks/useProgress";
import {
  ROAD_SIGN_CATEGORIES,
  roadSigns,
  trafficRules,
  safetyPrinciples,
  type RoadSignCategory,
} from "@/content/theory";
import { TrafficRulesLab } from "@/components/theory/TrafficRulesLab";
import { SafetyPrinciplesLab } from "@/components/theory/SafetyPrinciplesLab";
import { toast } from "sonner";

const LEARNED_STORAGE_KEY = "drivemy_theory_learned_signs_v2";

export function TheoryPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bm";
  const { user } = useAuthStore();
  const completion = useUpdateTheoryProgress();
  const progress = useTheoryProgressRows(user?.id ?? "");
  const reduceMotion = useReducedMotion();

  // Navigation & filter states
  const [activeTab, setActiveTab] = useState<string>("signs");
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<RoadSignCategory | "all">("all");
  const [showOnlyLearned, setShowOnlyLearned] = useState<boolean>(false);

  // Card flip and learned states
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [learned, setLearned] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(LEARNED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Spot-the-sign mini drill state
  const [drillIndex, setDrillIndex] = useState<number>(0);
  const [drillPicked, setDrillPicked] = useState<number | null>(null);
  const [drillScore, setDrillScore] = useState<number>(0);

  // Sync learned state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(learned));
    } catch {
      // Ignore localStorage write errors in private mode
    }
  }, [learned]);

  const moduleCompleted = progress.data?.some(
    (row) => row.module_id === `theory-${activeTab}` && row.completed,
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    completion.reset();
  };

  const toggleLearned = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLearned((prev) => {
      const nextState = !prev[id];
      if (nextState) {
        toast.success(
          lang === "en" ? "Marked as learned." : "Ditandai sebagai dipelajari.",
          { duration: 1500 },
        );
      }
      return { ...prev, [id]: nextState };
    });
  };

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered signs based on search, category pill, and favorites filter
  const filteredSigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roadSigns.filter((sign) => {
      if (selectedCategory !== "all" && sign.type !== selectedCategory) return false;
      if (showOnlyLearned && !learned[sign.id]) return false;
      if (!q) return true;
      return (
        sign.name.toLowerCase().includes(q) ||
        sign.nameMs.toLowerCase().includes(q) ||
        sign.meaning.toLowerCase().includes(q) ||
        sign.meaningMs.toLowerCase().includes(q) ||
        sign.action.toLowerCase().includes(q) ||
        sign.actionMs.toLowerCase().includes(q)
      );
    });
  }, [search, selectedCategory, showOnlyLearned, learned]);

  // Mastered counts per category
  const categoryMastery = useMemo(() => {
    const counts: Record<string, { total: number; learned: number }> = {};
    for (const cat of ROAD_SIGN_CATEGORIES) {
      counts[cat.id] = { total: 0, learned: 0 };
    }
    for (const sign of roadSigns) {
      if (counts[sign.type]) {
        counts[sign.type].total += 1;
        if (learned[sign.id]) counts[sign.type].learned += 1;
      }
    }
    return counts;
  }, [learned]);

  // Total signs mastered
  const totalMasteredCount = useMemo(() => {
    return roadSigns.filter((sign) => learned[sign.id]).length;
  }, [learned]);

  const drillNumber = drillIndex % roadSigns.length;
  const drillSign = roadSigns[drillNumber];
  const correctSlot = drillNumber % 4;
  const drillOptions = Array.from({ length: 4 }, (_, slot) => {
    const offset = (slot - correctSlot + 4) % 4;
    return {
      img: roadSigns[(drillNumber + offset) % roadSigns.length].img,
      correct: offset === 0,
    };
  });

  const handlePickDrill = (index: number) => {
    if (drillPicked !== null) return;
    setDrillPicked(index);
    if (drillOptions[index]?.correct) {
      setDrillScore((s) => s + 1);
    }
  };

  const handleNextDrill = () => {
    setDrillPicked(null);
    setDrillIndex((i) => i + 1);
  };

  const learnedLabel = (done: boolean) =>
    lang === "en"
      ? done
        ? "Mark as not learned"
        : "Mark as learned"
      : done
        ? "Tandakan belum dipelajari"
        : "Tandakan sudah dipelajari";

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      {/* Sticky Header with Search and Navigation */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border shadow-xs -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="pill pill-brand">
                {lang === "en" ? "Official JPJ Curriculum" : "Kurikulum Rasmi JPJ"}
              </span>
              <span className="text-xs text-muted-foreground">
                {lang === "en" ? "KPP01 Theory Masterclass" : "Sukatan Teori KPP01"}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading tracking-tight mt-1 text-foreground">
              {lang === "en" ? "Theory learning" : "Pembelajaran teori"}
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder={
                  lang === "en"
                    ? "Search signs, rules, or safety..."
                    : "Cari tanda, undang-undang, keselamatan..."
                }
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-muted/40 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary focus:bg-background transition-colors"
                aria-label={
                  lang === "en"
                    ? "Search learning topics"
                    : "Cari topik pembelajaran"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={lang === "en" ? "Clear search" : "Kosongkan carian"}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Primary Tabs List */}
        <div className="mt-3">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full sm:w-auto overflow-x-auto justify-start inline-flex flex-nowrap hide-scrollbar">
              <TabsTrigger value="signs">
                {lang === "en" ? "Road Signs" : "Papan Tanda"}
              </TabsTrigger>
              <TabsTrigger value="rules">
                {lang === "en" ? "Traffic Rules" : "Undang-undang"}
              </TabsTrigger>
              <TabsTrigger value="safety">
                {lang === "en" ? "Safety" : "Keselamatan"}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {search &&
          !(activeTab === "signs"
            ? filteredSigns.length
            : activeTab === "rules"
              ? trafficRules.filter((r) =>
                  `${r.title} ${r.titleMs} ${r.content} ${r.contentMs}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                ).length
              : safetyPrinciples.filter((p) =>
                  `${p.title} ${p.titleMs} ${p.content} ${p.contentMs}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                ).length) && (
            <div role="status" className="panel p-5 mb-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {lang === "en"
                  ? "No topics match your search query."
                  : "Tiada topik sepadan dengan carian anda."}
              </p>
              <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                {lang === "en" ? "Clear search" : "Kosongkan carian"}
              </Button>
            </div>
          )}

        {/* TAB 1: ROAD SIGNS */}
        {activeTab === "signs" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {/* Visual Grammar Deck - 5 Category Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold font-heading">
                    {lang === "en"
                      ? "Visual grammar of Malaysian road signs"
                      : "Tatabahasa visual papan tanda jalan Malaysia"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Every road sign shape and colour communicates a precise legal meaning"
                      : "Setiap bentuk dan warna membawa maksud undang-undang yang tepat"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill pill-brand">
                    {totalMasteredCount}/{roadSigns.length}{" "}
                    {lang === "en" ? "mastered" : "dikuasai"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOnlyLearned(!showOnlyLearned)}
                    aria-pressed={showOnlyLearned}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      showOnlyLearned
                        ? "bg-brand text-brand-foreground border-foreground"
                        : "bg-background text-foreground border-border hover:border-foreground/40"
                    }`}
                  >
                    <Star
                      size={14}
                      className={showOnlyLearned ? "fill-brand-foreground" : ""}
                      aria-hidden="true"
                    />
                    <span>{lang === "en" ? "Learned only" : "Dipelajari sahaja"}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills & Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {ROAD_SIGN_CATEGORIES.map((cat) => {
                  const mastery = categoryMastery[cat.id] ?? { total: 0, learned: 0 };
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(isSelected ? "all" : cat.id)
                      }
                      aria-pressed={isSelected}
                      className={`tile p-3 text-left flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                        isSelected ? "tile-selected" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`pill text-[0.8125rem] py-0.5 px-2 ${cat.swatchClass}`}>
                            {cat.shapeEn.split(" ")[0]}
                          </span>
                          <span className="type-figure text-xs text-muted-foreground">
                            {mastery.learned}/{mastery.total}
                          </span>
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-foreground mt-1">
                          {lang === "en" ? cat.labelEn : cat.labelMs}
                        </div>
                      </div>
                      <div className="text-[0.8125rem] text-muted-foreground line-clamp-2 leading-snug">
                        {lang === "en" ? cat.colorRuleEn : cat.colorRuleMs}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive "Spot-the-Sign" Rapid Drill */}
            <div className="panel p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="pill pill-info">
                    {lang === "en" ? "Interactive knowledge drill" : "Latihan uji minda pantas"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lang === "en" ? "Question" : "Soalan"} {drillNumber + 1} of{" "}
                    {roadSigns.length}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-foreground">
                    {lang === "en" ? "Score:" : "Skor:"} {drillScore}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                  {lang === "en" ? `Which sign means “${drillSign.meaning}”?` : `Papan tanda manakah bermaksud “${drillSign.meaningMs}”?`}
                </p>

                {/* Four sourced sign options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {drillOptions.map((opt, idx) => {
                    const picked = drillPicked === idx;
                    const answered = drillPicked !== null;
                    let stateClass = "";
                    if (answered) {
                      if (opt.correct) stateClass = "border-success bg-success/10 shadow-xs";
                      else if (picked) stateClass = "border-destructive bg-destructive/10";
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={answered}
                        onClick={() => handlePickDrill(idx)}
                        className={`tile p-4 h-36 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all disabled:cursor-default ${stateClass} ${
                          picked ? "tile-selected" : ""
                        }`}
                      >
                        <img
                          src={opt.img}
                          alt={lang === "en" ? "Road sign option" : "Pilihan papan tanda"}
                          className="max-w-[72px] max-h-[72px] object-contain drop-shadow-xs"
                          loading="lazy"
                        />
                        {answered && opt.correct && (
                          <span className="text-[0.8125rem] font-bold text-success flex items-center gap-1">
                            <Check size={13} aria-hidden="true" />
                            {lang === "en" ? "Correct" : "Tepat"}
                          </span>
                        )}
                        {answered && picked && !opt.correct && (
                          <span className="text-[0.8125rem] font-bold text-destructive flex items-center gap-1">
                            <X size={13} aria-hidden="true" />
                            {lang === "en" ? "Incorrect" : "Salah"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {drillPicked !== null && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground">
                      {drillOptions[drillPicked]?.correct
                        ? lang === "en"
                          ? "Great eye! Verified against the official KPP curriculum."
                          : "Tepat sekali! Disahkan mengikut kurikulum rasmi KPP."
                        : lang === "en"
                          ? "Review the correct sign above, checked against the textbook."
                          : "Lihat tanda yang betul di atas, disahkan mengikut buku teks."}
                    </p>
                    <Button size="sm" onClick={handleNextDrill}>
                      {lang === "en" ? "Next challenge" : "Cabaran seterusnya"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sign Flashcards and Reference Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-base font-bold font-heading">
                    {selectedCategory === "all"
                      ? lang === "en"
                        ? `${roadSigns.length} road signs and markings`
                        : `${roadSigns.length} papan tanda dan penandaan jalan`
                      : ROAD_SIGN_CATEGORIES.find((c) => c.id === selectedCategory)
                        ? lang === "en"
                          ? ROAD_SIGN_CATEGORIES.find((c) => c.id === selectedCategory)?.labelEn
                          : ROAD_SIGN_CATEGORIES.find((c) => c.id === selectedCategory)?.labelMs
                        : ""}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Flip a card to read what the sign means and how to respond."
                      : "Balikkan kad untuk membaca maksud tanda dan tindakan yang sesuai."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {filteredSigns.length}{" "}
                    {lang === "en" ? "signs shown" : "tanda dipaparkan"}
                  </span>
                  {selectedCategory !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {lang === "en" ? "Show all" : "Papar semua"}
                    </button>
                  )}
                </div>
              </div>

              {filteredSigns.length === 0 ? (
                <div className="panel p-6 text-center text-sm text-muted-foreground">
                  {lang === "en"
                    ? "No signs match your filter criteria."
                    : "Tiada papan tanda sepadan dengan tapisan anda."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSigns.map((sign) => {
                    const isFlipped = !!flipped[sign.id];
                    const isLearned = !!learned[sign.id];

                    return (
                      <div
                        key={sign.id}
                        data-sign-card
                        className="relative h-[290px] perspective-1000 cursor-pointer group"
                      >
                        <div
                          className={`w-full h-full transition-transform [transition-duration:var(--motion)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none transform-style-3d ${
                            isFlipped ? "rotate-y-180" : ""
                          }`}
                        >
                          {/* Front Face */}
                          <Card
                            inert={isFlipped}
                            aria-hidden={isFlipped}
                            className="rounded-xl border-border/60 text-card-foreground absolute inset-0 backface-hidden flex flex-col items-center justify-between bg-card border hover:border-primary/50 transition-colors shadow-xs overflow-hidden"
                          >
                            {/* Star favorite toggle */}
                            <button
                              type="button"
                              onClick={(e) => toggleLearned(e, sign.id)}
                              className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-background/85 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                              aria-label={learnedLabel(isLearned)}
                            >
                              <Star
                                size={15}
                                className={`transition-all duration-200 ${
                                  isLearned
                                    ? "fill-brand text-brand-foreground scale-110"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-hidden="true"
                              />
                            </button>

                            {/* Sign Graphic Area */}
                            <div className="w-full flex-1 flex flex-col items-center justify-center p-4 bg-muted/10 group-hover:bg-muted/25 transition-colors">
                              <img
                                src={sign.img}
                                alt={lang === "en" ? sign.name : sign.nameMs}
                                className="max-w-[110px] max-h-[110px] object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="mt-2 text-center px-2">
                                <span className="text-xs font-bold text-foreground line-clamp-1">
                                  {lang === "en" ? sign.name : sign.nameMs}
                                </span>
                              </div>
                            </div>

                            {/* Flip trigger footer */}
                            <button
                              type="button"
                              data-flip
                              onClick={(event) => {
                                const card = event.currentTarget.closest("[data-sign-card]");
                                toggleFlip(sign.id);
                                requestAnimationFrame(() =>
                                  card
                                    ?.querySelector<HTMLButtonElement>(
                                      "button[data-flip]:not([inert] button)",
                                    )
                                    ?.focus(),
                                );
                              }}
                              className="w-full p-2.5 border-t border-border bg-background/95 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary group-hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                              <span>{lang === "en" ? "Tap to reveal" : "Ketik untuk jawapan"}</span>
                              <Repeat size={13} aria-hidden="true" />
                            </button>
                          </Card>

                          {/* Back Face */}
                          <Card
                            inert={!isFlipped}
                            aria-hidden={!isFlipped}
                            className="rounded-xl border border-border/60 absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between bg-card p-4 shadow-sm text-card-foreground overflow-hidden"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <Badge variant="outline" className="text-[0.8125rem] uppercase font-bold tracking-wider">
                                  {sign.type}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={(e) => toggleLearned(e, sign.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer"
                                  aria-label={learnedLabel(isLearned)}
                                >
                                  <Star
                                    size={14}
                                    className={
                                      isLearned
                                        ? "fill-brand text-brand-foreground"
                                        : "text-muted-foreground"
                                    }
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>

                              <h4 className="font-heading font-bold text-sm text-foreground line-clamp-2">
                                {lang === "en" ? sign.name : sign.nameMs}
                              </h4>

                              <div className="text-xs text-muted-foreground space-y-1.5 overflow-y-auto max-h-[125px] pr-1 leading-relaxed">
                                <div>
                                  <span className="font-semibold text-foreground">
                                    {lang === "en" ? "Meaning: " : "Maksud: "}
                                  </span>
                                  {lang === "en" ? sign.meaning : sign.meaningMs}
                                </div>
                                <div>
                                  <span className="font-semibold text-foreground">
                                    {lang === "en" ? "Action: " : "Tindakan: "}
                                  </span>
                                  {lang === "en" ? sign.action : sign.actionMs}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border flex justify-end">
                              <button
                                type="button"
                                data-flip
                                onClick={(event) => {
                                  const card = event.currentTarget.closest("[data-sign-card]");
                                  toggleFlip(sign.id);
                                  requestAnimationFrame(() =>
                                    card
                                      ?.querySelector<HTMLButtonElement>(
                                        "button[data-flip]:not([inert] button)",
                                      )
                                      ?.focus(),
                                  );
                                }}
                                className="flex items-center gap-1 text-[0.8125rem] font-semibold text-primary hover:underline cursor-pointer"
                              >
                                <Repeat size={12} aria-hidden="true" />
                                {lang === "en" ? "Flip back" : "Pusing semula"}
                              </button>
                            </div>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Quick Quiz Shortcut */}
              <div className="panel p-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-heading font-bold text-base flex items-center gap-2">
                    <Star size={16} className="text-brand fill-brand" aria-hidden="true" />
                    {lang === "en"
                      ? "Ready to test your sign knowledge in an exam quiz?"
                      : "Bersedia menguji pengetahuan papan tanda dalam kuiz peperiksaan?"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === "en"
                      ? "Part A has three practice sets of 15 questions each."
                      : "Bahagian A mempunyai tiga set latihan dengan 15 soalan setiap set."}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(ROUTES.QUIZ)}
                  className="shrink-0 w-full sm:w-auto"
                >
                  {lang === "en" ? "Start Part A Quiz" : "Mula Kuiz Bahagian A"}
                  <ChevronRight size={14} className="ml-1" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: TRAFFIC RULES */}
        {activeTab === "rules" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {/* Interactive Lab First */}
            <TrafficRulesLab lang={lang} />

            {/* Comprehensive Textbook Modules */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-heading">
                    {lang === "en"
                      ? "Part B traffic rules"
                      : "Peraturan jalan raya Bahagian B"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Lessons on licensing, road markings and driving rules"
                      : "Pelajaran tentang lesen, tanda jalan dan peraturan pemanduan"}
                  </p>
                </div>
                <span className="pill pill-neutral">
                  {trafficRules.length} {lang === "en" ? "modules" : "modul"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trafficRules
                  .filter(
                    (r) =>
                      r.title.toLowerCase().includes(search.toLowerCase()) ||
                      r.titleMs.toLowerCase().includes(search.toLowerCase()) ||
                      r.content.toLowerCase().includes(search.toLowerCase()) ||
                      r.contentMs.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((rule) => (
                    <Card
                      key={rule.id}
                      className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="pill pill-info text-[0.8125rem]">{rule.badge}</span>
                          </div>
                          <h4 className="font-heading font-bold text-base text-foreground leading-snug">
                            {lang === "en" ? rule.title : rule.titleMs}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {lang === "en" ? rule.content : rule.contentMs}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SAFETY PRINCIPLES */}
        {activeTab === "safety" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {/* Interactive Safety Lab First */}
            <SafetyPrinciplesLab lang={lang} />

            {/* Comprehensive Safety Principles Reference */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-heading">
                    {lang === "en"
                      ? "Part C defensive driving syllabus"
                      : "Sukatan pemanduan berhemah Bahagian C"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "8 core modules covering SIPDE, pre-drive checks, tyre diagnostics, and emergency management"
                      : "8 modul utama merangkumi SIPDE, pemeriksaan kenderaan, tayar, dan kecemasan"}
                  </p>
                </div>
                <span className="pill pill-neutral">
                  {safetyPrinciples.length} {lang === "en" ? "modules" : "modul"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safetyPrinciples
                  .filter(
                    (p) =>
                      p.title.toLowerCase().includes(search.toLowerCase()) ||
                      p.titleMs.toLowerCase().includes(search.toLowerCase()) ||
                      p.content.toLowerCase().includes(search.toLowerCase()) ||
                      p.contentMs.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((p) => (
                    <Card
                      key={p.id}
                      className="border border-border/80 hover:border-primary/40 transition-colors shadow-xs"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="pill pill-info text-[0.8125rem]">{p.badge}</span>
                          </div>
                          <h4 className="font-heading font-bold text-base text-foreground leading-snug">
                            {lang === "en" ? p.title : p.titleMs}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {lang === "en" ? p.content : p.contentMs}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Module Completion Panel */}
        <div className="panel mt-8 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {lang === "en"
                  ? `Completed review of module: ${
                      activeTab === "signs"
                        ? "Road Signs"
                        : activeTab === "rules"
                          ? "Traffic Rules"
                          : "Safety Principles"
                    }`
                  : `Selesai mengulang kaji modul: ${
                      activeTab === "signs"
                        ? "Papan Tanda"
                        : activeTab === "rules"
                          ? "Undang-undang"
                          : "Prinsip Keselamatan"
                    }`}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "en"
                  ? "Marking this module complete updates your exam readiness score."
                  : "Menandakan modul ini selesai akan mengemas kini skor kesediaan peperiksaan anda."}
              </p>
            </div>
            <Button
              disabled={
                !user ||
                progress.isPending ||
                progress.isError ||
                moduleCompleted ||
                completion.isPending
              }
              loading={completion.isPending}
              onClick={() => {
                if (user) {
                  completion.mutate({
                    user_id: user.id,
                    module_id: `theory-${activeTab}`,
                    completed: true,
                    completed_at: new Date().toISOString(),
                  });
                }
              }}
            >
              {moduleCompleted
                ? lang === "en"
                  ? "Module completed"
                  : "Modul selesai"
                : lang === "en"
                  ? "Mark module complete"
                  : "Tandakan modul selesai"}
            </Button>
          </div>

          {completion.isSuccess && (
            <p role="status" className="text-xs text-success font-semibold">
              {lang === "en" ? "Completion saved." : "Penyiapan disimpan."}
            </p>
          )}

          {(progress.isError || completion.isError) && (
            <p role="alert" className="text-xs text-destructive font-semibold">
              {lang === "en"
                ? "Could not load or save completion. Please reload and try again."
                : "Tidak dapat memuatkan atau menyimpan penyiapan. Muat semula dan cuba lagi."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
