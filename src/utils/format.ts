import { format, formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import type { Locale } from '@/types/models';

const localeMap = { tr, en: enUS } as const;

export function formatDate(timestamp: number, pattern: string, locale: Locale = 'tr'): string {
  return format(timestamp, pattern, { locale: localeMap[locale] });
}

export function timeAgo(timestamp: number, locale: Locale = 'tr'): string {
  return formatDistanceToNowStrict(timestamp, { addSuffix: true, locale: localeMap[locale] });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}d`;
  return `${m}d ${s}s`;
}

export function formatWeight(kg: number): string {
  if (Number.isInteger(kg)) return `${kg}`;
  return kg.toFixed(1);
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}
