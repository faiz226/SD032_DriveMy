import { describe, it, expect } from 'vitest';
import { cn, clamp, truncate, formatDuration, percentage } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('p-4', 'bg-red-500', { 'text-white': true })).toBe('p-4 bg-red-500 text-white');
    });

    it('handles tailwind conflicts', () => {
      expect(cn('p-4 p-8')).toBe('p-8');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });

  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('hello world', 5)).toBe('he...');
      expect(truncate('hi', 5)).toBe('hi');
    });
  });

  describe('formatDuration', () => {
    it('formats seconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(59)).toBe('00:59');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(3599)).toBe('59:59');
    });
  });

  describe('percentage', () => {
    it('calculates percentage correctly', () => {
      expect(percentage(5, 10)).toBe(50);
      expect(percentage(1, 3)).toBe(33.3);
      expect(percentage(0, 10)).toBe(0);
      expect(percentage(5, 0)).toBe(0);
    });
  });
});
