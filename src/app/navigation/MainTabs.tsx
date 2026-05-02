import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
import { ExerciseListScreen } from '@/features/exercises/screens/ExerciseListScreen';
import { ProgramsScreen } from '@/features/programs/screens/ProgramsScreen';
import { ReportsScreen } from '@/features/reports/screens/ReportsScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';

import { AppTabBar } from './AppTabBar';
import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

/**
 * MainTabs — özel AppTabBar kullanır (Lucide ikonlar, pill aktif state,
 * üstünde aktif workout mini banner).
 */
export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen
        name="Exercises"
        component={ExerciseListScreen}
        options={{ title: t('tabs.exercises') }}
      />
      <Tab.Screen
        name="Programs"
        component={ProgramsScreen}
        options={{ title: t('tabs.programs') }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: t('tabs.reports') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}
