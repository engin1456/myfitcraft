import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  AuthStack: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  ExerciseDetail: { exerciseId: string };
  ProgramDetail: { programId: string };
  ProgramBuilder: { programId?: string };
  ProgramSchedule: { programId: string };
  ActiveWorkout: undefined;
  WorkoutSummary: { workoutId: string };
  Measurements: undefined;
  AddMeasurement: undefined;
  Legal: { kind: 'privacy' | 'terms' };
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Exercises: { initialMuscleFilter?: string } | undefined;
  Programs: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type MainTabScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
