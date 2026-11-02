// The simulator's settings (the owner, 2 Nov): the sound, the keys and how the gears change, and the rest. The same
// panel opens from the first screen and, while driving, from the settings button; the drive pauses while it is open.
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';
import type { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { ACTIONS, type Action, bindable, type GearPref, keyLabel, type TouchPref, useKeyNames, useKeys, useSettingsPanel } from '../input';
import type { Tier, TierPref } from '../quality';
import { useVolume, type VoicePref } from './sound';

export interface SettingsProps {
  quality: TierPref; detected: Tier; touch: TouchPref; voice: VoicePref; gears: GearPref;
  onQuality(p: TierPref): void; onTouch(p: TouchPref): void; onVoice(p: VoicePref): void; onGears(p: GearPref): void;
}

export function SimSettings({ settings }: { settings: SettingsProps }) {
  const { t } = useLanguage();
  const names = useKeyNames();
  const v = useVolume();
  const onOff: ['on' | 'off', string][] = [['on', t('sim.settings.on')], ['off', t('sim.settings.off')]];
  return (
    <Tabs defaultValue="sound" className="space-y-3">
      <TabsList>
        <TabsTrigger value="sound">{t('sim.settings.sound')}</TabsTrigger>
        <TabsTrigger value="controls">{t('sim.settings.controls')}</TabsTrigger>
        <TabsTrigger value="other">{t('sim.settings.other')}</TabsTrigger>
      </TabsList>
      <TabsContent value="sound" className="space-y-3">
        <Volume label={t('sim.settings.master')} value={v.master} onChange={(x) => v.setVolume({ master: x })} />
        <Volume label={t('sim.settings.effects')} value={v.effects} onChange={(x) => v.setVolume({ effects: x })} />
        <Volume label={t('sim.settings.ambience')} value={v.ambience} onChange={(x) => v.setVolume({ ambience: x })} />
        <Volume label={t('sim.settings.voiceVolume')} value={v.voice} onChange={(x) => v.setVolume({ voice: x })} />
        <Choice label={t('sim.settings.voice')} value={settings.voice} options={onOff} onChange={settings.onVoice} />
      </TabsContent>
      <TabsContent value="controls" className="space-y-3">
        <Choice
          label={t('sim.settings.gears')}
          value={settings.gears}
          options={[['off', t('sim.settings.gearsAuto', names)], ['on', t('sim.settings.gearsReal', names)]]}
          onChange={settings.onGears}
        />
        <Keys />
      </TabsContent>
      <TabsContent value="other" className="space-y-3">
        <Choice
          label={t('sim.settings.quality')}
          value={settings.quality}
          options={[
            ['auto', t('sim.settings.auto', { what: t(settings.detected === 'low' ? 'sim.settings.low' : 'sim.settings.medium') })],
            ['low', t('sim.settings.low')],
            ['medium', t('sim.settings.medium')],
          ]}
          onChange={settings.onQuality}
        />
        <Choice
          label={t('sim.settings.touch')}
          value={settings.touch}
          options={[['auto', t('sim.settings.touchAuto')], ['on', t('sim.settings.on')], ['off', t('sim.settings.off')]]}
          onChange={settings.onTouch}
        />
      </TabsContent>
    </Tabs>
  );
}

/** While driving: the settings, over the paused drive. */
export function SettingsDialog({ settings }: { settings: SettingsProps }) {
  const { t } = useLanguage();
  const open = useSettingsPanel((s) => s.open);
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? useSettingsPanel.getState().show() : useSettingsPanel.getState().hide())}>
      {/* above the simulator's own layer (z-70); its paused screen dims the drive behind */}
      <DialogContent className="z-[90] max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogTitle className="type-label-strong text-lg">{t('sim.settings.title')}</DialogTitle>
        <SimSettings settings={settings} />
      </DialogContent>
    </Dialog>
  );
}

function Volume({ label, value, onChange }: { label: string; value: number; onChange(v: number): void }) {
  const id = useId();
  const pct = Math.round(value * 100);
  return (
    <div className="grid grid-cols-[minmax(7rem,1fr)_2fr_3rem] items-center gap-3">
      <label htmlFor={id} className="type-label text-sm">{label}</label>
      <input id={id} type="range" min={0} max={100} step={5} value={pct} onChange={(e) => onChange(Number(e.target.value) / 100)} className="w-full accent-brand" />
      <span className="type-label text-right text-sm tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * Each action and its key: press the key's button, then the new key (Esc keeps the old one). The new key is taken as
 * it comes up, so the press never reaches the button again, the drive or the dialog.
 */
function Keys() {
  const { t } = useLanguage();
  const keys = useKeys((s) => s.keys);
  const [taking, setTaking] = useState<Action | null>(null);
  useEffect(() => {
    if (!taking) return;
    const hold = (e: KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); };
    const take = (e: KeyboardEvent) => {
      hold(e);
      if (e.code === 'Escape') setTaking(null);
      else if (bindable(e.code)) {
        useKeys.getState().bind(taking, e.code);
        setTaking(null);
      }
    };
    window.addEventListener('keydown', hold, true);
    window.addEventListener('keyup', take, true);
    return () => {
      window.removeEventListener('keydown', hold, true);
      window.removeEventListener('keyup', take, true);
    };
  }, [taking]);
  return (
    <div className="space-y-2">
      <p className="type-label-strong text-sm">{t('sim.settings.keys')}</p>
      <div className="space-y-1">
        {ACTIONS.map((a) => {
          const name = t(`sim.key.${a}` as TranslationKey);
          return (
            <div key={a} className="flex items-center justify-between gap-3">
              <span className="type-label text-sm">{name}</span>
              <button type="button" aria-label={`${name}: ${keyLabel(keys[a])}`} aria-pressed={taking === a} onClick={() => setTaking(a)}
                className={cn('tile tap-sm min-w-[6rem] px-2 py-1 text-sm', taking === a ? 'tile-selected' : 'tile-open')}>
                {taking === a ? t('sim.settings.pressKey') : keyLabel(keys[a])}
              </button>
            </div>
          );
        })}
      </div>
      <p className="type-label text-xs">{t('sim.settings.fixedKeys')}</p>
      <Button variant="outline" onClick={() => { setTaking(null); useKeys.getState().reset(); }}>{t('sim.settings.resetKeys')}</Button>
    </div>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange(v: T): void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="type-label text-sm">{label}</span>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn('tile tap-sm px-2 py-1 text-sm', value === v ? 'tile-selected' : 'tile-open')}>
          {text}
        </button>
      ))}
    </div>
  );
}
