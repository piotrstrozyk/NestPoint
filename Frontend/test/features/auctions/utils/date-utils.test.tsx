import {
  getDisabledDateRanges,
  getStartOfToday,
  toLocalDateTimeString,
} from '@/features/auctions/utils/date-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('date-utils', () => {
  describe('toLocalDateTimeString', () => {
    it('should format date correctly', () => {
      const testDate = new Date(2025, 5, 22, 14, 30, 45); // June 22, 2025, 14:30:45
      const formatted = toLocalDateTimeString(testDate);
      expect(formatted).toBe('2025-06-22T14:30:45');
    });

    it('should pad single digit values with zeros', () => {
      const testDate = new Date(2025, 0, 1, 1, 2, 3); // Jan 1, 2025, 01:02:03
      const formatted = toLocalDateTimeString(testDate);
      expect(formatted).toBe('2025-01-01T01:02:03');
    });
  });

  describe('getStartOfToday', () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      // Save original Date constructor
      originalDate = global.Date;

      // Mock current date to June 22, 2025, 14:30:45
      const mockDate = new Date(2025, 5, 22, 14, 30, 45);
      global.Date = vi.fn(() => mockDate) as unknown as typeof Date;
      (global.Date as unknown as { now: () => number }).now = vi.fn(() =>
        mockDate.getTime(),
      );
    });

    afterEach(() => {
      // Restore original Date constructor
      global.Date = originalDate;
    });

    it('should return date set to start of today', () => {
      const startOfToday = getStartOfToday();

      expect(startOfToday.getFullYear()).toBe(2025);
      expect(startOfToday.getMonth()).toBe(5); // June
      expect(startOfToday.getDate()).toBe(22);
      expect(startOfToday.getHours()).toBe(0);
      expect(startOfToday.getMinutes()).toBe(0);
      expect(startOfToday.getSeconds()).toBe(0);
      expect(startOfToday.getMilliseconds()).toBe(0);
    });

    it('should be based on current date', () => {
      // New date mock implementation that returns the date constructor
      global.Date = vi.fn((...args: unknown[]) => {
        if (args.length === 0) {
          return new originalDate(2025, 5, 22, 14, 30, 45);
        }
        return new originalDate(
          ...(args as ConstructorParameters<typeof Date>),
        );
      }) as unknown as typeof Date;
      (global.Date as unknown as { now: () => number }).now = vi.fn(() =>
        new originalDate(2025, 5, 22, 14, 30, 45).getTime(),
      );

      const startOfToday = getStartOfToday();
      expect(startOfToday.getDate()).toBe(22);
      expect(startOfToday.getMonth()).toBe(5);
      expect(startOfToday.getFullYear()).toBe(2025);
    });
  });

  describe('getDisabledDateRanges', () => {
    let originalDate: typeof Date;

    beforeEach(() => {
      // Save original Date constructor
      originalDate = global.Date;

      // Mock current date to June 22, 2025
      const mockDate = new Date(2025, 5, 22, 10, 0, 0);
      global.Date = vi.fn((...args: unknown[]) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(
          ...(args as ConstructorParameters<typeof Date>),
        );
      }) as unknown as typeof Date;
      (global.Date as unknown as { now: () => number }).now = vi.fn(() =>
        mockDate.getTime(),
      );
    });

    afterEach(() => {
      // Restore original Date constructor
      global.Date = originalDate;
    });

    it('should return range from epoch to yesterday', () => {
      const ranges = getDisabledDateRanges();

      expect(ranges.length).toBe(1);
      expect(ranges[0].from.getTime()).toBe(0); // Epoch

      // Calculate expected "yesterday" (end of yesterday)
      const startOfToday = new Date(2025, 5, 22);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfYesterday = new Date(startOfToday.getTime() - 1);

      expect(ranges[0].to.getTime()).toBe(endOfYesterday.getTime());
    });
  });
});
