import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export default function SubjectsLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Materias', headerLargeTitle: true }} />
    </Stack>
  );
}
