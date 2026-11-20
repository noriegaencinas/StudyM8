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
      <Stack.Screen name="note/[id]/flashcards" options={{ title: 'Tarjetas' }} />
      <Stack.Screen name="note/[id]/generate-flashcards" options={{ title: 'Generar tarjetas' }} />
      <Stack.Screen name="note/[id]/study" options={{ title: 'Repaso' }} />
      <Stack.Screen name="note/[id]/quizzes" options={{ title: 'Cuestionarios' }} />
      <Stack.Screen name="note/[id]/generate-quiz" options={{ title: 'Nuevo cuestionario' }} />
      <Stack.Screen name="note/[id]/assistant" options={{ title: 'Asistente' }} />
      <Stack.Screen name="quiz/[id]" options={{ title: 'Cuestionario' }} />
    </Stack>
  );
}
