import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/lib/translations/en';
import { useKeys } from '../input';
import { SimSettings, type SettingsProps } from './Settings';
import { useVolume } from './sound';

const settings: SettingsProps = {
  quality: 'auto', detected: 'low', touch: 'auto', voice: 'on', gears: 'off',
  onQuality: vi.fn(), onTouch: vi.fn(), onVoice: vi.fn(), onGears: vi.fn(),
};
const key = (type: 'keydown' | 'keyup', code: string) => act(() => { window.dispatchEvent(new KeyboardEvent(type, { code })); });

describe('the settings (the owner, 2 Nov)', () => {
  beforeEach(() => act(() => useKeys.getState().reset()));

  it("a key's button, then a new key, gives the action that key; Esc keeps the old one", () => {
    render(<SimSettings settings={settings} />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: en['sim.settings.controls'] }));
    fireEvent.click(screen.getByRole('button', { name: `${en['sim.key.horn']}: H` }));
    key('keydown', 'KeyJ');
    key('keyup', 'KeyJ');
    expect(useKeys.getState().keys.horn).toBe('KeyJ');
    fireEvent.click(screen.getByRole('button', { name: `${en['sim.key.horn']}: J` }));
    key('keydown', 'Escape');
    key('keyup', 'Escape');
    expect(useKeys.getState().keys.horn).toBe('KeyJ');
  });

  it('the volume slider sets the volume, from 0 to 1', () => {
    render(<SimSettings settings={settings} />);
    fireEvent.change(screen.getByLabelText(en['sim.settings.master']), { target: { value: '40' } });
    expect(useVolume.getState().master).toBe(0.4);
  });
});
