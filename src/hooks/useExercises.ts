import { useEffect, useMemo } from 'react';

import { useExercisesStore, selectFilteredExercises } from '@/stores/exercises.store';

export function useExercises() {
  const load = useExercisesStore((s) => s.load);
  const items = useExercisesStore((s) => s.items);
  const loading = useExercisesStore((s) => s.loading);
  const loaded = useExercisesStore((s) => s.loaded);
  const searchQuery = useExercisesStore((s) => s.searchQuery);
  const muscleFilter = useExercisesStore((s) => s.muscleFilter);
  const equipmentFilter = useExercisesStore((s) => s.equipmentFilter);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      selectFilteredExercises({
        items,
        searchQuery,
        muscleFilter,
        equipmentFilter,
      } as Parameters<typeof selectFilteredExercises>[0]),
    [items, searchQuery, muscleFilter, equipmentFilter],
  );

  return {
    items,
    filtered,
    loading,
    loaded,
  };
}
