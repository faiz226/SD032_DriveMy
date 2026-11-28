import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SignColourBoard } from "@/components/theory/SignColourBoard";
import { SignMiniQuizzes } from "@/components/theory/SignMiniQuizzes";
import { SafetyPage } from "@/pages/SafetyPage";
import { categoryProgress } from "@/lib/signQuiz";
import { searchRpk } from "@/lib/rpkSearch";
import { learnedKeyFor, readLearned } from "@/lib/learnedSigns";
import { creditForImg, signFilenameFromImg } from "@/lib/signCredits";
import { toast } from "sonner";


type BoardKind = "all" | RoadSignCategory;

/**
 * Each category card is the sign board of its category, so the colour is the code. Board colours are fixed (a
 * real sign does not change with the theme); every pair clears 4.5:1. Chosen is a thick ring in the brand ink and
 * a tick, never a change of board colour, so it reads on every board.
 */
const BOARDS: Record<BoardKind, string> = {
  // Warning: amber, black border and text.
  warning: "bg-[#F6C21A] text-[#111] border-4 border-[#111]",
  // Prohibitory: white, a thick red border, dark text.
  prohibitory: "bg-white text-[#111] border-[6px] border-plate-red",
  // Mandatory: blue, white text, a thin white inner edge.
  mandatory: "bg-[#0A5FBF] text-white border-4 border-[#0A5FBF] shadow-[inset_0_0_0_2px_#fff]",
  // Informational: blue, white text. (JKR uses green only for direction signs on expressways.)
  informational: "bg-[#0A5FBF] text-white border-4 border-[#0A5FBF]",
  // Temporary: orange, black text.
  temporary: "bg-[#F28C28] text-[#111] border-4 border-[#111]",
  // All signs: a calm dark board with the five colours as a strip.
  all: "bg-[#262522] text-white border-4 border-[#262522]",
};

const STRIP = ["#F6C21A", "#FFFFFF", "#0A5FBF", "#0A5FBF", "#F28C28"];

function CategoryTile({ kind, selected, onSelect, title, count }: { kind: BoardKind; selected: boolean; onSelect: () => void; title: string; count: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex min-h-[4.75rem] flex-col justify-between gap-2 overflow-hidden rounded-xl p-3 text-left outline-none transition-[box-shadow,transform] duration-200 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:ring-4 focus-visible:ring-brand-ink focus-visible:ring-offset-2 focus-visible:ring-offset-background ${BOARDS[kind]} ${selected ? "ring-4 ring-brand-ink ring-offset-2 ring-offset-background" : ""}`}
    >
      {selected && (
        <span aria-hidden="true" className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-foreground ring-2 ring-[#111]">
          <Check size={12} weight="bold" />
        </span>
      )}
      <span className="pr-5 text-sm font-extrabold leading-tight text-balance">{title}</span>
      <span className="type-figure text-base font-bold tabular-nums">{count}</span>
      {kind === "all" && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1.5">
          {STRIP.map((c, i) => <span key={i} className="flex-1" style={{ background: c }} />)}
        </span>
      )}
    </button>
  );
}

export function TheoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "bm";
  const { user } = useAuthStore();
  const completion = useUpdateTheoryProgress();
  const progress = useTheoryProgressRows(user?.id ?? "");
  const reduceMotion = useReducedMotion();

  // Navigation & filter states — honour ?tab=safety (used by /safety redirect)
  const rawTab = searchParams.get("tab");
  const initialTab = rawTab === "rules" || rawTab === "safety" ? rawTab : "signs";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  useEffect(() => {
    const next = searchParams.get("tab");
    if (next === "signs" || next === "rules" || next === "safety") {
      setActiveTab(next);
    }
  }, [searchParams]);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<RoadSignCategory | "all">("all");
  const [showOnlyLearned, setShowOnlyLearned] = useState<boolean>(false);

  // Card flip and learned states
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const learnedKey = learnedKeyFor(user?.id);
  const [learned, setLearned] = useState<Record<string, boolean>>(() => readLearned(user?.id));
  const [loadedKey, setLoadedKey] = useState(learnedKey);
  if (loadedKey !== learnedKey) {
    // Signed in or switched user: show that user's record.
    setLoadedKey(learnedKey);
    setLearned(readLearned(user?.id));
  }

  // Sync learned state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(learnedKey, JSON.stringify(learned));
    } catch {
      // Ignore localStorage write errors in private mode
    }
  }, [learned, learnedKey]);

  const moduleCompleted = progress.data?.some(
    (row) => row.module_id === `theory-${activeTab}` && row.completed,
  );

  // Learning every sign finishes the Road Signs module, so there is no button to press.
  const signsLearnt = categoryProgress(roadSigns.map((sign) => sign.id), learned).done;
  useEffect(() => {
    if (!user || !signsLearnt || progress.isPending || progress.isError || completion.isPending) return;
    if (progress.data?.some((row) => row.module_id === "theory-signs" && row.completed)) return;
    completion.mutate({ user_id: user.id, module_id: "theory-signs", completed: true, completed_at: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, signsLearnt, progress.isPending, progress.isError, progress.data]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "signs" ? {} : { tab }, { replace: true });
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

  /** Flips a card; the button path then moves focus to the face now showing, so keyboard users keep their place. */
  const flipCard = (from: Element, id: string, refocus: boolean) => {
    const card = from.closest("[data-sign-card]");
    toggleFlip(id);
    if (refocus)
      requestAnimationFrame(() =>
        card?.querySelector<HTMLButtonElement>("button[data-flip]:not([inert] button)")?.focus(),
      );
  };

  // Vehicle-check (RPK) steps that the search is after, so "brake fluid" finds its step.
  const rpkHits = useMemo(() => searchRpk(search), [search]);

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

  const learnedLabel = (done: boolean) =>
    lang === "en"
      ? done
        ? "Mark as not learned"
        : "Mark as learned"
      : done
        ? "Tandakan belum dipelajari"
        : "Tandakan sudah dipelajari";

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      {/* Search and Navigation: solid panel on mobile (keeps <=2 glass layers on phones), sticky floating Liquid Glass bar on md+ */}
      <div className="panel mt-3 rounded-2xl px-4 py-3.5 md:sticky md:top-3 md:z-20 md:mt-4 md:glass-bar md:px-5 md:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="page-title">
            {lang === "en" ? "KPP01 theory" : "Teori KPP01"}
          </h1>

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
                    ? "Search signs, rules, or safety"
                    : "Cari tanda, undang-undang, keselamatan"
                }
                className="w-full h-11 pl-9 pr-12 rounded-xl border border-input bg-card text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
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
                  className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
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
          <TabsList aria-label={lang === "en" ? "Theory topics" : "Topik teori"} className="h-auto w-full sm:w-auto justify-start inline-flex flex-wrap">
            <TabsTrigger value="signs" className="min-h-11 px-3">
              {lang === "en" ? "Road signs" : "Papan tanda"}
            </TabsTrigger>
            <TabsTrigger value="rules" className="min-h-11 px-3">
              {lang === "en" ? "Traffic rules" : "Undang-undang"}
            </TabsTrigger>
            <TabsTrigger value="safety" className="min-h-11 px-3">
              {lang === "en" ? "Hazards and safety" : "Bahaya dan keselamatan"}
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value={activeTab} className="mt-6">
        {rpkHits.length > 0 && (
          <section className="panel mb-6 space-y-3 p-4 sm:p-5" aria-label={lang === "en" ? "Vehicle check steps" : "Langkah pemeriksaan kenderaan"}>
            <h2 className="text-base font-bold font-heading">
              {lang === "en" ? "Vehicle check (RPK)" : "Pemeriksaan kenderaan (RPK)"}
            </h2>
            <ul className="space-y-2">
              {rpkHits.map((hit) => (
                <li key={`${hit.topicId}-${hit.step}`}>
                  <Link
                    to={`${ROUTES.RPK_RSM}?topic=${hit.topicId}&step=${hit.step + 1}`}
                    className="tile block p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-ink"
                  >
                    <span className="block text-xs font-semibold text-muted-foreground">
                      {hit.routine.toUpperCase()} · {lang === "en" ? hit.title.en : hit.title.ms} ·{" "}
                      {lang === "en" ? `step ${hit.step + 1}` : `langkah ${hit.step + 1}`}
                    </span>
                    <span className="line-clamp-2">{lang === "en" ? hit.text.en : hit.text.ms}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!search && (
          <Link
            to={ROUTES.RPK_RSM}
            className="panel mb-6 flex items-center justify-between gap-3 p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-brand-ink sm:p-5"
          >
            <span>
              <span className="block text-base font-bold font-heading">
                {lang === "en" ? "Vehicle check (RPK)" : "Pemeriksaan kenderaan (RPK)"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {lang === "en"
                  ? "Tyres, lights, engine bay and boot: the checks before you drive."
                  : "Tayar, lampu, ruang enjin dan but: pemeriksaan sebelum memandu."}
              </span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        )}

        {search && rpkHits.length === 0 &&
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
              <Button variant="outline" size="sm" className="min-h-11" onClick={() => setSearch("")}>
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
                      ? "Malaysian road sign categories"
                      : "Kategori papan tanda jalan Malaysia"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Choose a category to filter the signs."
                      : "Pilih kategori untuk menapis papan tanda."}
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
                    className={`tap-sm px-3 py-1.5 rounded-lg text-xs font-semibold border transition-[color,background-color,border-color,transform] duration-300 ease-spring active:scale-[0.97] motion-reduce:active:scale-100 cursor-pointer inline-flex items-center gap-1.5 ${
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                <CategoryTile
                  kind="all"
                  selected={selectedCategory === "all"}
                  onSelect={() => setSelectedCategory("all")}
                  title={lang === "en" ? "All signs" : "Semua papan tanda"}
                  count={`${Object.values(categoryMastery).reduce((sum, m) => sum + m.learned, 0)}/${roadSigns.length}`}
                />
                {ROAD_SIGN_CATEGORIES.map((cat) => {
                  const mastery = categoryMastery[cat.id] ?? { total: 0, learned: 0 };
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <CategoryTile
                      key={cat.id}
                      kind={cat.id}
                      selected={isSelected}
                      onSelect={() => setSelectedCategory(isSelected ? "all" : cat.id)}
                      title={lang === "en" ? cat.labelEn : cat.labelMs}
                      count={`${mastery.learned}/${mastery.total}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* What the colour and shape mean (a chosen category), then the mini quizzes */}
            {selectedCategory !== "all" && <SignColourBoard category={selectedCategory} lang={lang} />}
            <SignMiniQuizzes lang={lang} learnt={learned} onChange={setLearned} />

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
                      className="tap-sm inline-flex items-center justify-center rounded-lg px-3 text-xs font-semibold text-primary hover:bg-muted/60 hover:underline transition-colors cursor-pointer"
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
                    const credit = creditForImg(sign.img);
                    const creditFile = signFilenameFromImg(sign.img);
                    const creditSummary = !credit
                      ? null
                      : credit.isPublicDomain
                        ? lang === "en"
                          ? "Public domain"
                          : "Domain awam"
                        : `${credit.author} · ${credit.licenceName}`;

                    return (
                      <div
                        key={sign.id}
                        data-sign-card
                        onClick={(event) => {
                          // Anywhere on the card flips it; the star, credit link and footer button keep their own jobs.
                          if (!(event.target as HTMLElement).closest("button, a")) flipCard(event.currentTarget, sign.id, false);
                        }}
                        className="cv-auto relative h-[316px] perspective-1000 cursor-pointer group"
                      >
                        <div
                          className={`w-full h-full transition-transform [transition-duration:var(--motion-slow)] [transition-timing-function:var(--ease-spring)] motion-reduce:transition-none transform-style-3d ${
                            isFlipped ? "rotate-y-180" : ""
                          }`}
                        >
                          {/* Front Face */}
                          <Card
                            inert={isFlipped}
                            aria-hidden={isFlipped}
                            className="rounded-2xl border-border/70 text-card-foreground absolute inset-0 backface-hidden flex flex-col items-center justify-between bg-card border hover:border-primary/50 transition-colors shadow-xs overflow-hidden"
                          >
                            {/* Star favorite toggle */}
                            <button
                              type="button"
                              onClick={(e) => toggleLearned(e, sign.id)}
                              className="absolute top-1.5 right-1.5 z-10 h-11 w-11 rounded-full bg-background/90 flex items-center justify-center hover:bg-muted transition-colors active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                              aria-label={learnedLabel(isLearned)}
                            >
                              <Star
                                size={16}
                                className={`transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ${
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
                                alt={lang === "en" ? "Road sign" : "Papan tanda jalan"}
                                className="max-w-[110px] max-h-[110px] object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>

                            {/* Flip trigger footer */}
                            <button
                              type="button"
                              data-flip
                              onClick={(event) => flipCard(event.currentTarget, sign.id, true)}
                              className="w-full min-h-11 px-3 py-2.5 border-t border-border bg-background/95 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary group-hover:bg-primary/5 transition-colors cursor-pointer"
                            >
                              <span>{lang === "en" ? "Tap to reveal" : "Ketik untuk jawapan"}</span>
                              <Repeat size={13} aria-hidden="true" />
                            </button>
                          </Card>

                          {/* Back Face */}
                          <Card
                            inert={!isFlipped}
                            aria-hidden={!isFlipped}
                            className="rounded-2xl border border-border/70 absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-between bg-card px-4 pt-3 pb-0 shadow-sm text-card-foreground overflow-hidden"
                          >
                            <div className="space-y-1.5 min-h-0">
                              <div className="flex items-center justify-between gap-1">
                                <Badge variant="outline" className="text-[0.8125rem] font-semibold">
                                  {sign.type}
                                </Badge>
                                <button
                                  type="button"
                                  onClick={(e) => toggleLearned(e, sign.id)}
                                  className="-mr-2 -my-1.5 h-11 w-11 shrink-0 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-95 motion-reduce:active:scale-100 cursor-pointer"
                                  aria-label={learnedLabel(isLearned)}
                                >
                                  <Star
                                    size={15}
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

                              <div className="text-xs text-muted-foreground space-y-1.5 overflow-y-auto max-h-[120px] pr-1 leading-relaxed">
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

                            {creditSummary && (
                              <div className="pt-1.5 text-[0.75rem] text-muted-foreground truncate">
                                <Link
                                  to={`${ROUTES.SIGN_CREDITS}?sign=${encodeURIComponent(creditFile)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-link inline-flex items-center gap-1 max-w-full truncate"
                                >
                                  <span className="truncate">
                                    {lang === "en" ? "Credit: " : "Kredit: "}
                                    {creditSummary}
                                  </span>
                                </Link>
                              </div>
                            )}

                            <div className="-mx-4 mt-auto border-t border-border">
                              <button
                                type="button"
                                data-flip
                                onClick={(event) => flipCard(event.currentTarget, sign.id, true)}
                                className="w-full min-h-11 px-4 flex items-center justify-end gap-1.5 text-[0.8125rem] font-semibold text-primary hover:bg-primary/5 hover:underline transition-colors cursor-pointer"
                              >
                                <Repeat size={13} aria-hidden="true" />
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

              {/* Road sign image credits link */}
              <div className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {lang === "en"
                    ? "Malaysian road sign images are sourced from Wikimedia Commons under open licences."
                    : "Imej papan tanda jalan Malaysia diperoleh daripada Wikimedia Commons di bawah lesen terbuka."}
                </p>
                <Link
                  to={ROUTES.SIGN_CREDITS}
                  className="inline-link inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-semibold"
                >
                  <span>{lang === "en" ? "Road sign credits" : "Kredit papan tanda jalan"}</span>
                  <ChevronRight size={13} aria-hidden="true" />
                </Link>
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

        {/* TAB 3: HAZARDS AND SAFETY */}
        {activeTab === "safety" && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-8"
          >
            {/* Interactive Safety Lab First (stopping-distance scene, hazard pictures, flip cards) */}
            <SafetyPrinciplesLab lang={lang} />

            {/* KPP Road Emergency Drill (moved from /safety) */}
            <SafetyPage embedded />

            {/* Comprehensive Safety Principles Reference */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-heading">
                    {lang === "en"
                      ? "Defensive driving and safety lessons"
                      : "Pelajaran pemanduan berhemah dan keselamatan"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === "en"
                      ? "Following gaps, pre-drive checks, tyres and breakdowns"
                      : "Jarak mengekori, pemeriksaan sebelum memandu, tayar dan kerosakan"}
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

        {/* Bottom Module Completion Panel (Road Signs finishes through its mini quizzes instead) */}
        {activeTab !== "signs" && (
        <div className="panel mt-8 p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {lang === "en"
                  ? `Completed review of module: ${
                      activeTab === "signs"
                        ? "Road signs"
                        : activeTab === "rules"
                          ? "Traffic rules"
                          : "Hazards and safety"
                    }`
                  : `Selesai mengulang kaji modul: ${
                      activeTab === "signs"
                        ? "Papan tanda"
                        : activeTab === "rules"
                          ? "Undang-undang"
                          : "Bahaya dan keselamatan"
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
        )}
      </TabsContent>
    </Tabs>
  );
}
