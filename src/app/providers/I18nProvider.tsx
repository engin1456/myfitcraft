import { useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, { initI18n } from '@/i18n';
import { useSettingsStore } from '@/stores/settings.store';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function I18nProvider({ children, fallback = null }: Props) {
  const [ready, setReady] = useState(false);
  const persistedLocale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    let cancelled = false;
    initI18n(persistedLocale ?? undefined).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // Sadece ilk mount'ta init et; locale değişimini changeLanguage hallediyor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <>{fallback}</>;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
