import { useEffect } from 'react';

import { useProgramsStore } from '@/stores/programs.store';
import { useAuthStore } from '@/stores/auth.store';

export function usePrograms() {
  const uid = useAuthStore((s) => s.uid);
  const load = useProgramsStore((s) => s.load);
  const presets = useProgramsStore((s) => s.presets);
  const myPrograms = useProgramsStore((s) => s.myPrograms);
  const loading = useProgramsStore((s) => s.loading);
  const loaded = useProgramsStore((s) => s.loaded);

  useEffect(() => {
    load(uid);
  }, [load, uid]);

  return { presets, myPrograms, loading, loaded };
}
