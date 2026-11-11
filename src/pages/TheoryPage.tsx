import { Button } from "@/components/ui/button";
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowsClockwise as Repeat, MagnifyingGlass as Search, CaretRight as ChevronRight } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/stores/authStore';
import { useTheoryProgressRows, useUpdateTheoryProgress } from '@/hooks/useProgress';
import { roadSigns, trafficRules, safetyPrinciples } from '@/content/theory';
import { toast } from 'sonner';

export function TheoryPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'bm';
  const { user } = useAuthStore();
  const completion = useUpdateTheoryProgress();
  const progress = useTheoryProgressRows(user?.id ?? "");
  const [learned, setLearned] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('signs');

  const moduleCompleted = progress.data?.some(row => row.module_id === `theory-${activeTab}` && row.completed);
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    completion.reset();
  };

  // Toggle learned state for a sign (star button)
  const toggleLearned = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLearned((prev) => {
      const nowLearned = !prev[id];
      if (nowLearned) {
        toast.success(lang === 'en' ? 'Marked as learned.' : 'Ditandai sebagai dipelajari.', { duration: 1500 });
      }
      return { ...prev, [id]: nowLearned };
    });
  };

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const nowFlipped = !prev[id];
      return { ...prev, [id]: nowFlipped };
    });
  };

  const filteredSigns = useMemo(() => {
    return roadSigns.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nameMs.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const categories = ['Regulatory', 'Warning', 'Informational'];

  const categoryLabels: Record<string, string> = lang === "en"
    ? { Regulatory: "Regulatory signs", Warning: "Warning signs", Informational: "Information signs" }
    : { Regulatory: "Tanda peraturan", Warning: "Tanda amaran", Informational: "Tanda maklumat" };
  const learnedLabel = (done: boolean) => lang === "en"
    ? (done ? "Mark as not learned" : "Mark as learned")
    : (done ? "Tandakan belum dipelajari" : "Tandakan sudah dipelajari");

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Sticky Quick Navigation Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b shadow-sm pt-4 px-4 md:px-8 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">{lang === "en" ? "Theory learning" : "Pembelajaran teori"}</h1>
            <p className="text-sm text-muted-foreground">{lang === "en" ? "Review road rules and signs." : "Ulang kaji peraturan dan tanda jalan."}</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder={lang === 'en' ? "Search topics..." : "Cari topik..."}
                className="w-full h-10 pl-9 pr-4 rounded-xl border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={lang === "en" ? "Search learning topics" : "Cari topik pembelajaran"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 mt-6">
        {search && !(activeTab === "signs" ? filteredSigns.length : activeTab === "rules" ? trafficRules.filter(r => `${r.title} ${r.titleMs}`.toLowerCase().includes(search.toLowerCase())).length : safetyPrinciples.filter(p => `${p.title} ${p.titleMs}`.toLowerCase().includes(search.toLowerCase())).length) && <div role="status" className="panel p-4 mb-4"><p>{lang === "en" ? "No topics match your search." : "Tiada topik sepadan dengan carian anda."}</p><Button variant="outline" className="mt-3" onClick={() => setSearch("")}>{lang === "en" ? "Clear search" : "Kosongkan carian"}</Button></div>}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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

              const masteredCount = categorySigns.filter(s => learned[s.id]).length;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold font-heading">{categoryLabels[category]}</h2>
                      <Badge className="bg-muted text-foreground border-border" variant="outline">{categorySigns.length}</Badge>
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
                        data-sign-card
                        className="relative min-w-[240px] w-[70vw] md:w-auto md:min-w-0 snap-center h-[280px] perspective-1000 cursor-pointer group"
                      >
                        <div className={`w-full h-full transition-transform [transition-duration:var(--motion)] [transition-timing-function:var(--ease-out)] motion-reduce:transition-none transform-style-3d ${flipped[sign.id] ? 'rotate-y-180' : ''}`}>
                          {/* Front */}
                          <Card inert={!!flipped[sign.id]} aria-hidden={!!flipped[sign.id]} className="rounded-xl border-border/60 text-card-foreground duration-300 hover:shadow-lg absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-card border hover:border-primary/50 transition-colors shadow-sm overflow-hidden">
                            <button
                              onClick={(e) => toggleLearned(e, sign.id)}
                              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-muted transition-colors hover:scale-110 active:scale-95 duration-200"
                              aria-label={learnedLabel(!!learned[sign.id])}
                            >
                              <Star className={`w-4 h-4 transition-all duration-300 ${learned[sign.id] ? 'fill-brand text-brand-ink scale-110' : 'text-muted-foreground hover:text-brand-ink'}`} aria-hidden="true" />
                            </button>
                            <div className="w-full flex-1 flex items-center justify-center p-6 bg-muted/10 transition-colors duration-300 group-hover:bg-muted/30">
                              <img src={sign.img} alt={lang === 'en' ? sign.name : sign.nameMs} className="max-w-[130px] max-h-[130px] object-contain drop-shadow-md transition-transform duration-500 ease-out-back" loading="lazy" />
                            </div>
                            <button type="button" onClick={event => {
                              const card = event.currentTarget.closest('[data-sign-card]');
                              toggleFlip(sign.id);
                              requestAnimationFrame(() => card?.querySelector<HTMLButtonElement>('button[data-flip]:not([inert] button)')?.focus());
                            }} data-flip className="w-full p-4 border-t bg-background/95 backdrop-blur flex items-center justify-center gap-2 group-hover:bg-primary/5 transition-colors duration-300">
                              <span className="text-sm font-semibold text-primary">{lang === 'en' ? 'Tap to reveal' : 'Ketik untuk jawapan'}</span>
                              <Repeat className="w-4 h-4 text-primary transition-transform duration-500" aria-hidden="true" />
                            </button>
                          </Card>

                          {/* Back face — star marks as learned */}
                          <Card inert={!flipped[sign.id]} aria-hidden={!flipped[sign.id]} className="rounded-xl border border-border/60 transition-all duration-300 hover:shadow-lg absolute inset-0 backface-hidden rotate-y-180 flex flex-col bg-primary text-primary-foreground border-none p-5 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none transition-colors">
                                {categoryLabels[category]}
                              </Badge>
                              {/* Star on back face: tap to toggle learned */}
                              <button
                                onClick={(e) => toggleLearned(e, sign.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                                aria-label={learnedLabel(!!learned[sign.id])}
                              >
                                <Star
                                  className={`w-4 h-4 transition-all duration-300 ${learned[sign.id] ? 'fill-brand text-brand-ink scale-110' : 'text-primary-foreground/60 hover:text-brand-ink'}`}
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                            <h3 className="font-heading font-bold text-xl mb-2 text-primary-foreground">{lang === 'en' ? sign.name : sign.nameMs}</h3>
                            <p className="text-sm leading-relaxed text-primary-foreground/90 overflow-y-auto pr-1">
                              {lang === 'en' ? sign.desc : sign.descMs}
                            </p>
                            <button type="button" onClick={event => {
                              const card = event.currentTarget.closest('[data-sign-card]');
                              toggleFlip(sign.id);
                              requestAnimationFrame(() => card?.querySelector<HTMLButtonElement>('button[data-flip]:not([inert] button)')?.focus());
                            }} data-flip className="mt-auto pt-4 flex items-center justify-center gap-2 text-xs font-semibold text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200">
                              <Repeat className="w-3 h-3 transition-transform duration-500" aria-hidden="true" /> {lang === 'en' ? 'Tap to flip back' : 'Ketik untuk pusing'}
                            </button>
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
                        {lang === 'en' ? `Knowledge check: ${categoryLabels[category]}` : `Uji minda: ${categoryLabels[category]}`}
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
        <div className="panel mt-6 p-5 space-y-3">
          <p>{lang === 'en' ? 'Finished reviewing this module? Save your completion when you are ready.' : 'Sudah mengulang kaji modul ini? Simpan penyiapan apabila anda bersedia.'}</p>
          <Button disabled={!user || progress.isPending || progress.isError || moduleCompleted || completion.isPending} loading={completion.isPending} onClick={() => {
            if (user) completion.mutate({ user_id: user.id, module_id: `theory-${activeTab}`, completed: true, completed_at: new Date().toISOString() });
          }}>{moduleCompleted ? (lang === 'en' ? 'Module completed' : 'Modul selesai') : (lang === 'en' ? 'Mark module complete' : 'Tandakan modul selesai')}</Button>
          {completion.isSuccess && <p role="status">{lang === 'en' ? 'Completion saved.' : 'Penyiapan disimpan.'}</p>}
          {(progress.isError || completion.isError) && <p role="alert">{lang === 'en' ? 'Could not load or save completion. Please reload and try again.' : 'Tidak dapat memuatkan atau menyimpan penyiapan. Muat semula dan cuba lagi.'}</p>}
        </div>
      </div>
    </div>
  );
}
