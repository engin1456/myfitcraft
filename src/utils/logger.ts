/**
 * Lightweight logger.
 *
 * Production build'lerde (`__DEV__ === false`) `info` ve `debug` susar;
 * `warn` ve `error` her zaman çalışır çünkü olası bir crash reporter (Sentry vs.)
 * bunları yakalayabilmeli.
 *
 * Kullanım:
 *   import { logger } from '@/utils/logger';
 *   logger.info('[measurements] saved', id);
 *   logger.error('[programs] fetch failed', err);
 */

type Args = unknown[];

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

function safeConsoleCall(method: 'log' | 'warn' | 'error' | 'debug', args: Args): void {
  if (typeof console === 'undefined') return;
  const fn = console[method] as ((...a: Args) => void) | undefined;
  if (typeof fn === 'function') fn(...args);
}

/**
 * Crash reporter hook noktası.
 * Sentry / Bugsnag eklenince `setErrorReporter(Sentry.captureException)` ile bağlanır.
 * Default no-op — production'da bile silent fail.
 */
type ErrorReporter = (error: unknown, context?: Record<string, unknown>) => void;
let errorReporter: ErrorReporter = () => {};

export function setErrorReporter(fn: ErrorReporter): void {
  errorReporter = fn;
}

export const logger = {
  /** Geliştirici bilgisi. Production'da no-op. */
  info(...args: Args): void {
    if (isDev) safeConsoleCall('log', args);
  },
  /** Detaylı debug. Production'da no-op. */
  debug(...args: Args): void {
    if (isDev) safeConsoleCall('debug', args);
  },
  /** Tehlikeli ama fatal değil. Her ortamda çıkar. */
  warn(...args: Args): void {
    safeConsoleCall('warn', args);
  },
  /**
   * Hata. Console'a basar + crash reporter'a iletir (varsa).
   * İlk argüman string (etiket) ise, ikinci argüman (genelde Error objesi) reporter'a gönderilir.
   */
  error(...args: Args): void {
    safeConsoleCall('error', args);
    try {
      const err = args.find((a) => a instanceof Error) ?? args[args.length - 1];
      const tag = typeof args[0] === 'string' ? args[0] : undefined;
      errorReporter(err, tag ? { tag } : undefined);
    } catch {
      // Hiçbir koşulda log fonksiyonu kendi başına çakılmasın
    }
  },
};
