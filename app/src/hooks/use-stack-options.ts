import type { NativeStackNavigationOptions } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Opciones comunes para los `Stack` de cada pestaña. */
export function useStackOptions(): NativeStackNavigationOptions {
  const colors = useTheme();

  return {
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.text },
    headerStyle: { backgroundColor: colors.background },
    contentStyle: { backgroundColor: colors.background },
    headerBackButtonDisplayMode: 'minimal',
  };
}
