import { describe, expect, it } from 'vitest';
import { toDateInputValue } from './date';

describe('toDateInputValue', () => {
  it('formats a local calendar date without shifting to UTC', () => {
    expect(toDateInputValue(new Date(2026, 4, 1))).toBe('2026-05-01');
  });
});
