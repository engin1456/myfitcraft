import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';
import { useToastStore, type Toast as ToastModel } from '@/stores/toast.store';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Tüm app'in altında render edilecek toast container.
 * RootNavigator'ın paralelinde yer alır; yeni toast eklendikçe stack'lenir,
 * süresi dolanlar otomatik kaybolur.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, 16) + 70 }]}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

function ToastItem({ toast }: { toast: ToastModel }) {
  const theme = useTheme();
  const dismiss = useToastStore((s) => s.dismiss);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 10, duration: 200, useNativeDriver: true }),
      ]).start(() => dismiss(toast.id));
    }, toast.durationMs);

    return () => clearTimeout(timer);
  }, [toast, opacity, translateY, dismiss]);

  const { iconName, color } = ((): { iconName: IoniconName; color: string } => {
    switch (toast.variant) {
      case 'success':
        return { iconName: 'checkmark-circle', color: theme.colors.success };
      case 'error':
        return { iconName: 'close-circle', color: theme.colors.danger };
      default:
        return { iconName: 'information-circle', color: theme.colors.primary };
    }
  })();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: color + '40',
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        style={styles.toastInner}
        onPress={() => dismiss(toast.id)}
        hitSlop={4}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName} size={18} color={color} />
        </View>
        <Text size="sm" weight="semibold" style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
  },
});
