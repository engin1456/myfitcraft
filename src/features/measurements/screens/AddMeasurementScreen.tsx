import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Screen, Text, Input, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useMeasurementsStore } from '@/stores/measurements.store';
import { isFirebaseConfigured } from '@/services/firebase';
import { toast } from '@/stores/toast.store';
import type { BodyMeasurement } from '@/types/models';

interface FieldRow {
  key: keyof Pick<
    BodyMeasurement,
    'weight' | 'chest' | 'waist' | 'arm' | 'thigh' | 'neck' | 'bodyFatPct'
  >;
  labelKey: string;
  unit: string;
  placeholder: string;
}

const FIELDS: FieldRow[] = [
  { key: 'weight', labelKey: 'measurements.weight', unit: 'kg', placeholder: '75' },
  { key: 'chest', labelKey: 'measurements.chest', unit: 'cm', placeholder: '100' },
  { key: 'waist', labelKey: 'measurements.waist', unit: 'cm', placeholder: '80' },
  { key: 'arm', labelKey: 'measurements.arm', unit: 'cm', placeholder: '38' },
  { key: 'thigh', labelKey: 'measurements.thigh', unit: 'cm', placeholder: '60' },
  { key: 'neck', labelKey: 'measurements.neck', unit: 'cm', placeholder: '40' },
  { key: 'bodyFatPct', labelKey: 'measurements.bodyFat', unit: '%', placeholder: '15' },
];

type FieldKey = FieldRow['key'];

export function AddMeasurementScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const uid = useAuthStore((s) => s.uid);
  const add = useMeasurementsStore((s) => s.add);

  const [values, setValues] = useState<Record<FieldKey, string>>({
    weight: '',
    chest: '',
    waist: '',
    arm: '',
    thigh: '',
    neck: '',
    bodyFatPct: '',
  });

  const setField = (k: FieldKey, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
  };

  const onSave = async () => {
    if (!uid) return;
    if (!isFirebaseConfigured) {
      toast.error(t('errors.firebaseNotConfigured'));
      return;
    }

    const hasAtLeastOne = Object.values(values).some((v) => v.trim().length > 0);
    if (!hasAtLeastOne) {
      toast.error(t('errors.required'));
      return;
    }

    // Türkçe locale'de "75,5" yazıldıysa virgülü noktaya çevir.
    // NaN olursa null'a düşür (Firestore NaN kabul etmez, setDoc patlar).
    const parseNum = (raw: string): number | null => {
      if (!raw || !raw.trim()) return null;
      const n = Number(raw.replace(',', '.').trim());
      return Number.isFinite(n) ? n : null;
    };

    const parsed = {
      weight: parseNum(values.weight),
      chest: parseNum(values.chest),
      waist: parseNum(values.waist),
      arm: parseNum(values.arm),
      thigh: parseNum(values.thigh),
      neck: parseNum(values.neck),
      bodyFatPct: parseNum(values.bodyFatPct),
    };

    // En az 1 geçerli değer olmalı (NaN'leri null'a çevirdikten sonra)
    const hasValid = Object.values(parsed).some((v) => v !== null);
    if (!hasValid) {
      toast.error(t('measurements.invalidInput'));
      return;
    }

    const m: BodyMeasurement = {
      id: `${uid}-${Date.now()}`,
      userId: uid,
      date: Date.now(),
      ...parsed,
      notes: null,
    };

    // OPTIMISTIC FLOW:
    // 1. Hemen kaydı local state'e ekle (store içinde optimistic)
    // 2. Hemen geri dön (kullanıcı listede görür)
    // 3. Arka planda Firestore'a yaz; fail olursa toast ile haber ver
    add(m)
      .then(() => {
        toast.success(t('measurements.saved'));
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(t('measurements.saveFailed', { msg }), 4000);
      });

    // Hemen kapat — kullanıcı bekleyip spinner görmesin
    navigation.goBack();
  };

  return (
    <Screen scroll padded>
      <Text variant="title" style={styles.title}>
        {t('measurements.addNew')}
      </Text>

      <View style={styles.form}>
        {FIELDS.map((f) => (
          <Input
            key={f.key}
            label={`${t(f.labelKey)} (${f.unit})`}
            value={values[f.key]}
            onChangeText={(v) => setField(f.key, v)}
            keyboardType="decimal-pad"
            placeholder={f.placeholder}
          />
        ))}
      </View>

      <Button
        title={t('common.save')}
        onPress={onSave}
        style={styles.btn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  btn: {
    marginTop: 24,
  },
});
