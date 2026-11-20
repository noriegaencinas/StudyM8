import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export default function ProgressLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Progreso', headerLargeTitle: true }} />
    </Stack>
  );
}
