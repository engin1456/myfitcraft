import { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { Screen, Text, Input, Chip, EmptyState, CardSkeleton } from '@/components/ui';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { useExercises } from '@/hooks/useExercises';
import { useExercisesStore } from '@/stores/exercises.store';
import { ALL_MUSCLES } from '@/constants/muscles';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { Exercise, MuscleGroup } from '@/types/models';
import type {
  MainTabsParamList,
  RootStackParamList,
} from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteParams = RouteProp<MainTabsParamList, 'Exercises'>;

export function ExerciseListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();

  const { filtered, loaded } = useExercises();
  const searchQuery = useExercisesStore((s) => s.searchQuery);
  const muscleFilter = useExercisesStore((s) => s.muscleFilter);
  const setSearchQuery = useExercisesStore((s) => s.setSearchQuery);
  const setMuscleFilter = useExercisesStore((s) => s.setMuscleFilter);

  // Apply muscle filter from navigation params (e.g. donut chart tap)
  const initialMuscleFilter = route.params?.initialMuscleFilter;
  useEffect(() => {
    if (initialMuscleFilter && ALL_MUSCLES.includes(initialMuscleFilter as MuscleGroup)) {
      setMuscleFilter(initialMuscleFilter as MuscleGroup);
    }
  }, [initialMuscleFilter, setMuscleFilter]);

  const onPressExercise = useCallback(
    (exerciseId: string) => {
      navigation.navigate('ExerciseDetail', { exerciseId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard exercise={item} onPress={() => onPressExercise(item.id)} />
    ),
    [onPressExercise],
  );

  return (
    <Screen padded={false} withBottomInset>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <Text variant="title" style={styles.title}>
          {t('exercises.title')}
        </Text>
        <Input
          placeholder={t('exercises.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
          containerStyle={styles.search}
        />
      </View>

      <View style={[styles.chipsRow, { paddingHorizontal: theme.spacing.lg }]}>
        <Chip
          label={t('common.all')}
          selected={muscleFilter === null}
          onPress={() => setMuscleFilter(null)}
        />
        {ALL_MUSCLES.map((m: MuscleGroup) => (
          <Chip
            key={m}
            label={t(`muscles.${m}`)}
            selected={muscleFilter === m}
            onPress={() => setMuscleFilter(muscleFilter === m ? null : m)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing['5xl'],
          },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {loaded ? (
              <EmptyState
                iconName="search-outline"
                title={t('exercises.noResults')}
                description={t('exercises.noResultsDesc')}
                compact
              />
            ) : (
              <View style={{ width: '100%' }}>
                <CardSkeleton lines={2} />
                <CardSkeleton lines={2} />
                <CardSkeleton lines={2} />
              </View>
            )}
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
  },
  title: {
    marginBottom: 12,
  },
  search: {
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    paddingTop: 64,
    alignItems: 'center',
  },
});
