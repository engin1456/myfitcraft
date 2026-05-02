import { useEffect, useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Text, Card, Button } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useMeasurementsStore } from '@/stores/measurements.store';
import { WeightChart } from '@/components/charts/WeightChart';
import { formatDate } from '@/utils/format';
import type { BodyMeasurement, Locale } from '@/types/models';
import type { RootStackParamList } from '@/app/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MeasurementsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const uid = useAuthStore((s) => s.uid);

  const items = useMeasurementsStore((s) => s.items);
  const loaded = useMeasurementsStore((s) => s.loaded);
  const load = useMeasurementsStore((s) => s.load);
  const remove = useMeasurementsStore((s) => s.remove);

  useEffect(() => {
    if (uid) load(uid);
  }, [uid, load]);

  // Chart icin: en eski->en yeni sirala, sadece weight'i olanlar
  const weightSeries = useMemo(() => {
    return items
      .filter((m) => m.weight !== null)
      .slice()
      .reverse()
      .map((m) => ({
        timestamp: m.date,
        value: m.weight as number,
        label: formatDate(m.date, 'dd/MM', i18n.language as Locale),
      }));
  }, [items, i18n.language]);

  const onAdd = () => navigation.navigate('AddMeasurement');

  const onDelete = (m: BodyMeasurement) => {
    Alert.alert(t('common.appName'), t('common.delete') + '?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove(m.id).catch(() => {}),
      },
    ]);
  };

  const renderItem = ({ item }: { item: BodyMeasurement }) => (
    <Pressable onLongPress={() => onDelete(item)}>
      <Card style={styles.row}>
        <View style={styles.rowHead}>
          <Text weight="semibold">
            {formatDate(item.date, 'dd MMM yyyy', i18n.language as Locale)}
          </Text>
        </View>
        <View style={styles.metricsRow}>
          {item.weight !== null ? (
            <Metric label={t('measurements.weight')} value={`${item.weight}kg`} />
          ) : null}
          {item.chest !== null ? (
            <Metric label={t('measurements.chest')} value={`${item.chest}cm`} />
          ) : null}
          {item.waist !== null ? (
            <Metric label={t('measurements.waist')} value={`${item.waist}cm`} />
          ) : null}
          {item.arm !== null ? (
            <Metric label={t('measurements.arm')} value={`${item.arm}cm`} />
          ) : null}
          {item.thigh !== null ? (
            <Metric label={t('measurements.thigh')} value={`${item.thigh}cm`} />
          ) : null}
          {item.bodyFatPct !== null ? (
            <Metric label={t('measurements.bodyFat')} value={`%${item.bodyFatPct}`} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen padded={false} withBottomInset>
      <View style={[styles.header, { paddingHorizontal: theme.spacing.lg }]}>
        <View style={styles.headerRow}>
          <Text variant="title">{t('measurements.title')}</Text>
          <Button size="sm" fullWidth={false} title={t('measurements.addNew')} onPress={onAdd} />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing['5xl'] },
        ]}
        ListHeaderComponent={
          weightSeries.length >= 2 ? (
            <Card style={styles.chartCard}>
              <WeightChart
                points={weightSeries}
                unit="kg"
                title={t('reports.weightProgress')}
              />
            </Card>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text muted align="center">
              {loaded ? t('measurements.noMeasurements') : t('common.loading')}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="caption" muted>
        {label}
      </Text>
      <Text size="sm" weight="semibold">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  chartCard: {
    marginBottom: 16,
  },
  row: {
    gap: 8,
  },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metric: {
    minWidth: 64,
  },
  emptyWrap: {
    paddingTop: 64,
  },
});
