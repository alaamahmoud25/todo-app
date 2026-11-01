import type { Lang } from './i18n';

// The app's time zone (same as TIME_ZONE in Django)
export const APP_TIME_ZONE = 'Africa/Cairo';

// 'ar-EG' = Egyptian Arabic, 'en-US' = English
// Use 'ar-EG-u-nu-latn' to show Western digits (123) instead of Arabic-Indic digits in Arabic
const locales: Record<Lang, string> = {
  ar: 'ar-EG',
  en: 'en-US',
};

// "السبت، ٢ نوفمبر، ٦:٠٠ م" or "Sat, Nov 2, 6:00 PM"
export function formatDateTime(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(locales[lang], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso));
}

// Short weekday from a date like "2026-11-02" (used by the charts)
export function formatDay(dateOnly: string, lang: Lang) {
  return new Intl.DateTimeFormat(locales[lang], {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC', // Date-only value, so read it as is
  }).format(new Date(`${dateOnly}T00:00:00Z`));
}

// "بعد ساعتين" / "in 2 hours", "من 3 أيام" / "3 days ago"
export function formatRelative(iso: string, lang: Lang) {
  const diffMs = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(locales[lang], { numeric: 'auto' });

  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

// Converts any time to an <input type="datetime-local"> value in Cairo time
// e.g. "2026-11-01T18:00:00+02:00" becomes "2026-11-01T18:00"
export function toCairoInputValue(date: Date | string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(date));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

// Quick due-date picks for the form
export function quickDate(kind: 'inHour' | 'tonight' | 'tomorrow') {
  if (kind === 'inHour') {
    return toCairoInputValue(new Date(Date.now() + 60 * 60 * 1000));
  }
  // Today's date in Cairo
  const today = toCairoInputValue(new Date()).slice(0, 10);
  if (kind === 'tonight') return `${today}T21:00`;
  // Tomorrow: add one day to today's date
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return `${tomorrow.toISOString().slice(0, 10)}T09:00`;
}
