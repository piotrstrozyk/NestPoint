import { padStart } from 'lodash';

export function toLocalDateTimeString(d: Date) {
  const yyyy = d.getFullYear();
  const MM = padStart(String(d.getMonth() + 1), 2, '0');
  const dd = padStart(String(d.getDate()), 2, '0');
  const hh = padStart(String(d.getHours()), 2, '0');
  const mm = padStart(String(d.getMinutes()), 2, '0');
  const ss = padStart(String(d.getSeconds()), 2, '0');
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
}

export function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDisabledDateRanges(
  occupiedRanges?: Array<{ startDate: Date | string; endDate: Date | string }>,
) {
  const startOfToday = getStartOfToday();

  // Create a range for past dates
  const pastDatesRange = {
    from: new Date(0),
    to: new Date(startOfToday.getTime() - 1),
  };

  // If no occupied ranges, just return past dates as disabled
  if (!occupiedRanges || occupiedRanges.length === 0) {
    return [pastDatesRange];
  }

  // Convert any string dates to Date objects and combine with past dates
  return [
    pastDatesRange,
    ...occupiedRanges.map((range) => ({
      from:
        range.startDate instanceof Date
          ? range.startDate
          : new Date(range.startDate),
      to:
        range.endDate instanceof Date ? range.endDate : new Date(range.endDate),
    })),
  ];
}
