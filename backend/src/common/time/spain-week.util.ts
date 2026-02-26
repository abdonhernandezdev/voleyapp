const SPAIN_TIME_ZONE = 'Europe/Madrid';

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return { year, month, day };
}

function getWeekdayInTimeZone(date: Date, timeZone: string): number {
  const dayKey = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(date);
  return WEEKDAY_INDEX[dayKey] ?? 1;
}

function shiftDateParts(parts: DateParts, days: number): DateParts {
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function getOffsetMinutesForZone(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);

  const zonePart = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = zonePart.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/);

  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function zonedDateTimeToUtc(parts: DateParts, hour = 0, minute = 0, second = 0): Date {
  const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);
  const guess = new Date(utcMillis);
  const offsetMinutes = getOffsetMinutesForZone(guess, SPAIN_TIME_ZONE);
  return new Date(utcMillis - offsetMinutes * 60_000);
}

export function getSpainWeekRange(now = new Date()): { start: Date; end: Date } {
  const todayParts = getDatePartsInTimeZone(now, SPAIN_TIME_ZONE);
  const weekday = getWeekdayInTimeZone(now, SPAIN_TIME_ZONE); // Monday = 1, Sunday = 7
  const daysFromMonday = weekday - 1;

  const mondayParts = shiftDateParts(todayParts, -daysFromMonday);
  const nextMondayParts = shiftDateParts(mondayParts, 7);

  return {
    start: zonedDateTimeToUtc(mondayParts, 0, 0, 0),
    end: zonedDateTimeToUtc(nextMondayParts, 0, 0, 0),
  };
}

