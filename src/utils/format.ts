import { format, formatDistanceToNowStrict } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import type { Locale } from '@/types/models';
import { logger } from '@/utils/logger';

const localeMap = { tr, en: enUS } as const;

/**
 * date-fns `format` etrafinda guvenli sarici. Hatali pattern (ornegin
 * "Format string contains an unescaped latin alphabet character") app'i
 * cokertmesin diye fallback'e ISO tarihi donduruyoruz.
 */
export function formatDate(timestamp: number, pattern: string, locale: Locale = 'tr'): string {
  try {
    return format(timestamp, pattern, { locale: localeMap[locale] });
  } catch (err) {
    logger.warn('[format] formatDate failed', { pattern, err });
    try {
      return new Date(timestamp).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }
}

export function timeAgo(timestamp: number, locale: Locale = 'tr'): string {
  try {
    return formatDistanceToNowStrict(timestamp, { addSuffix: true, locale: localeMap[locale] });
  } catch (err) {
    logger.warn('[format] timeAgo failed', err);
    return '';
  }
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
