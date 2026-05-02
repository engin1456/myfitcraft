import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Text, Button, CardSkeleton, EmptyState } from '@/components/ui';
import { ProgramCard } from '@/components/program/ProgramCard';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgramsStore } from '@/stores/programs.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/app/providers/ThemeProvider';
import type { RootStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = 'preset' | 'mine';

export function ProgramsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { presets, myPrograms, loaded, loading } = usePrograms();
  const reload = useProgramsStore((s) => s.load);
  const uid = useAuthStore((s) => s.uid);
  const [tab, setTab] = useState<Tab>('preset');

  const onOpen = (programId: string) => {
    navigation.navigate('ProgramDetail', { programId });
  };

  const onRefresh = useCallback(() => {
    reload(uid);
  }, [reload, uid]);

  return (
    <Screen
      scroll
      padded
      withBottomInset
      refreshing={loading && loaded}
      onRefresh={onRefresh}
    >
      <View style={styles.headerRow}>
        <Text variant="title">{t('programs.title')}</Text>
        <Button
          size="sm"
          fullWidth={false}
          title={t('programs.createNew')}
          leftIcon={<Ionicons name="add" size={18} color={theme.colors.primaryContrast} />}
          onPress={() => navigation.navigate('ProgramBuilder', {})}
        />
      </View>

      <View style={[styles.tabs, { borderColor: theme.colors.border }]}>
        <TabButton label={t('programs.presetTab')} active={tab === 'preset'} onPress={() => setTab('preset')} />
        <TabButton label={t('programs.myTab')} active={tab === 'mine'} onPress={() => setTab('mine')} />
      </View>

      {tab === 'preset' ? (
        <View style={styles.list}>
          {!loaded && presets.length === 0 ? (
            <>
              <CardSkeleton lines={2} />
              <CardSkeleton lines={2} />
              <CardSkeleton lines={2} />
            </>
          ) : (
            presets.map((bundle) => (
              <ProgramCard
                key={bundle.program.id}
                program={bundle.program}
                exerciseCount={bundle.exercises.length}
                onPress={() => onOpen(bundle.program.id)}
              />
            ))
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {myPrograms.length === 0 ? (
            <EmptyState
              iconName="calendar-outline"
              title={t('programs.noPrograms')}
              description={t('programs.noProgramsDesc')}
              ctaLabel={t('programs.createNew')}
              onCtaPress={() => navigation.navigate('ProgramBuilder', {})}
            />
          ) : (
            myPrograms.map((p) => (
              <ProgramCard key={p.id} program={p} onPress={() => onOpen(p.id)} />
            ))
          )}
        </View>
      )}
    </Screen>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabBtn,
        active && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
      ]}
    >
      <Text variant="body" weight={active ? 'semibold' : 'regular'} muted={!active}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  list: {
    gap: 12,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyBtn: {
    marginTop: 8,
  },
});
