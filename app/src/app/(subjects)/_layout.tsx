import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export default function SubjectsLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Materias', headerLargeTitle: true }} />
      <Stack.Screen name="subject/new" options={{ title: 'Nueva materia' }} />
      <Stack.Screen name="subject/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="subject/[id]/edit" options={{ title: 'Editar materia' }} />
      <Stack.Screen name="note/new" options={{ title: 'Nuevo apunte' }} />
      <Stack.Screen name="note/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="note/[id]/edit" options={{ title: 'Editar apunte' }} />
    </Stack>
  );
}
