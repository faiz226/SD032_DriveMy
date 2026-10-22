// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { carFiles, textureFiles } from './assets';
import { detectTier, TIERS } from './quality';

describe('quality tiers', () => {
  it('Android phones get Low; iPhones and desktops get Medium; little memory gets Low', () => {
    expect(detectTier({ userAgent: 'Mozilla/5.0 (Linux; Android 11; M2010J19SG) Chrome/141 Mobile Safari/537.36' })).toBe('low');
    expect(detectTier({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1' })).toBe('medium');
    expect(detectTier({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141 Safari/537.36', deviceMemory: 8 })).toBe('medium');
    expect(detectTier({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141 Safari/537.36', deviceMemory: 4 })).toBe('low');
  });

  it('the tiers differ as WP5 sets them', () => {
    expect(TIERS.low).toMatchObject({ shadows: false, clearcoat: false, renderScale: [0.7, 0.85] });
    expect(TIERS.medium).toMatchObject({ shadows: true, clearcoat: true, renderScale: [0.85, 1] });
    expect(TIERS.low.mirrors.budget).toBe(256 * 128);
    expect(TIERS.medium.mirrors).toMatchObject({ perFrame: 3, budget: 512 * 256 });
    expect(TIERS.low.mirrors.perFrame).toBeLessThan(TIERS.medium.mirrors.perFrame);
  });

  it('each tier loads its own files: 512 px textures on Low, 1024 px on Medium', () => {
    expect(carFiles('low').body).toBe('/sim/cars/swift-2022/low/body.glb');
    expect(carFiles('medium').wheel).toBe('/sim/cars/swift-2022/medium/wheel.glb');
    expect(textureFiles('low')).toEqual(['/sim/textures/concrete-512.webp', '/sim/textures/grass-512.webp', '/sim/textures/asphalt-512.webp']);
    expect(textureFiles('medium')[0]).toBe('/sim/textures/concrete-1024.webp');
  });
});
