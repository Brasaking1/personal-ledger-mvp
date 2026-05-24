import { describe, expect, it } from 'vitest';
import { currentDayRange, currentMonthRange, currentWeekRange, toDateInputValue } from './date';

describe('toDateInputValue', () => {
  it('formats a local calendar date without shifting to UTC', () => {
    expect(toDateInputValue(new Date(2026, 4, 1))).toBe('2026-05-01');
  });
});

describe('current date ranges', () => {
  it('returns today as the day range', () => {
    expect(currentDayRange(new Date(2026, 4, 24))).toEqual({
      start: '2026-05-24',
      end: '2026-05-24'
    });
  });

  it('returns Monday through today as the week range', () => {
    expect(currentWeekRange(new Date(2026, 4, 24))).toEqual({
      start: '2026-05-18',
      end: '2026-05-24'
    });
  });

  it('returns the first day of the month through today as the month range', () => {
    expect(currentMonthRange(new Date(2026, 4, 24))).toEqual({
      start: '2026-05-01',
      end: '2026-05-24'
    });
  });
});
