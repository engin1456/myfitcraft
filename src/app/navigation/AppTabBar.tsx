import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/app/providers/ThemeProvider';
import { Text } from '@/components/ui';
import { ActiveWorkoutMiniBanner } from '@/components/workout/ActiveWorkoutMiniBanner';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Her sekme için focused/unfocused ikon çifti
const ICON_MAP: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Exercises: { active: 'barbell', inactive: 'barbell-outline' },
  Programs: { active: 'calendar', inactive: 'calendar-outline' },
  Reports: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

/**
 * Estetik özel tab bar:
 * - Aktif sekmede pill arka plan + ikon biraz büyür
 * - Lucide ikonlar (28px), label sm bold
 * - Safe area inset bottom destek
 * - Üstünde aktif workout mini banner sticky
 * - Tab değişiminde hafif haptic
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <ActiveWorkoutMiniBanner />

      <View
        style={[
          styles.barShadow,
          {
            shadowColor: theme.mode === 'dark' ? '#000' : '#000',
          },
        ]}
      >
        <View
          style={[
            styles.bar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const iconPair = ICON_MAP[route.name] ?? ICON_MAP.Home;
            const iconName = focused ? iconPair.active : iconPair.inactive;
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : (options.title ?? route.name);

            const onPress = (e: GestureResponderEvent) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync().catch(() => {});
                }
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabItem
                key={route.key}
                label={label}
                iconName={iconName}
                focused={focused}
                color={focused ? theme.colors.primary : theme.colors.textMuted}
                pillBg={theme.colors.primary + '18'}
                onPress={onPress}
                accessibilityRole={'button' as AccessibilityRole}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface TabItemProps {
  label: string;
  iconName: IoniconName;
  focused: boolean;
  color: string;
  pillBg: string;
  onPress: (e: GestureResponderEvent) => void;
  accessibilityRole: AccessibilityRole;
}

function TabItem({
  label,
  iconName,
  focused,
  color,
  pillBg,
  onPress,
  accessibilityRole,
}: TabItemProps) {
  // Aktif tab'da subtle scale (1 → 1.08)
  const scale = useRef(new Animated.Value(focused ? 1.08 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  }, [focused, scale]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      android_ripple={{ color: pillBg, borderless: true, radius: 36 }}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          focused && { backgroundColor: pillBg },
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
      </Animated.View>
      <Text
        size="xs"
        weight={focused ? 'semibold' : 'regular'}
        color={color}
        style={styles.label}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
  },
  barShadow: {
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 12,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
});
