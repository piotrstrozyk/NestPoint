import { formatDate } from '@/core/lib/utils/format-date';
import { describe, expect, it, vi } from 'vitest';

describe('formatDate', () => {
  it('returns formatted date for valid Date object', () => {
    const date = new Date('2023-06-15T00:00:00Z');
    // The output depends on timezone, but should include 'Jun' and '2023'
    const result = formatDate(date);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2023/);
  });

  it('returns formatted date for valid date string', () => {
    const result = formatDate('2023-06-15T00:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2023/);
  });

  it('returns formatted date for valid timestamp', () => {
    const timestamp = Date.UTC(2023, 5, 15); // June 15, 2023
    const result = formatDate(timestamp);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2023/);
  });

  it('returns "No date available" for null', () => {
    expect(formatDate(null)).toBe('No date available');
  });

  it('returns "No date available" for undefined', () => {
    expect(formatDate(undefined)).toBe('No date available');
  });

  it('returns "Invalid date" for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid date');
  });

  it('returns "Invalid date" for NaN timestamp', () => {
    expect(formatDate(NaN)).toBe('Invalid date');
  });

  it('returns "Invalid date" for Date with NaN time', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid date');
  });

  it('returns "Date error" and logs error if exception is thrown', () => {
    const spy = vi.spyOn(global.console, 'error').mockImplementation(() => {});
    // Force an error by passing an object that will throw in getTime
    const badObj = {
      getTime: () => {
        throw new Error('fail');
      },
    };
    expect(
      formatDate(
        badObj as unknown as string | number | Date | null | undefined,
      ),
    ).toBe('Date error');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
