/**
 * Unit tests for the cn() utility helper.
 */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('merges multiple class strings', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays and objects via clsx', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c');
  });
});
