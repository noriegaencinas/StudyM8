import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StudyAction } from '@/components/study-action';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { HeaderButton } from '@/components/ui/header-button';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { formatDate, plural } from '@/lib/format';

export default function NoteScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: note, error, refreshing, refresh, reload } = useResource(`note-${id}`, () =>
    api.getNote(id),
  );
  const flashcards = useResource(`flashcards-${id}`, () => api.listFlashcards(id));
  const quizzes = useResource(`quizzes-${id}`, () => api.listQuizzes(id));

  const header = (
    <Stack.Screen
      options={{
        title: note?.subject.name ?? '',
        headerRight: () => (
          <HeaderButton
            icon="edit"
            label="Editar apunte"
            onPress={() => router.push({ pathname: '/note/[id]/edit', params: { id } })}
          />
        ),
      }}
    />
  );

  if (!note) {
    return (
      <>
        {header}
        {error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />}
      </>
    );
  }

  const cardCount = flashcards.data?.length;
  const quizCount = quizzes.data?.length;

  return (
    <>
      {header}
      <Screen
        refreshing={refreshing}
        onRefresh={() => {
          void refresh();
          void flashcards.refresh();
          void quizzes.refresh();
        }}>
        <View style={styles.heading}>
          <View style={[styles.subjectChip, { backgroundColor: note.subject.color }]}>
            <ThemedText type="caption" style={styles.subjectChipText} numberOfLines={1}>
              {note.subject.name}
            </ThemedText>
          </View>
          <ThemedText type="title">{note.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Actualizado el {formatDate(note.updated_at)}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Estudiar</ThemedText>
          <StudyAction
            icon="cards"
            title="Tarjetas de memoria"
            subtitle={
              cardCount === undefined
                ? 'Repasa los conceptos clave'
                : cardCount === 0
                  ? 'Genéralas con IA a partir de este apunte'
                  : `${plural(cardCount, 'tarjeta', 'tarjetas')} para repasar`
            }
            onPress={() => router.push({ pathname: '/note/[id]/flashcards', params: { id } })}
          />
          <StudyAction
            icon="quiz"
            title="Cuestionarios"
            subtitle={
              quizCount === undefined
                ? 'Comprueba cuánto aprendiste'
                : quizCount === 0
                  ? 'Crea uno con IA para ponerte a prueba'
                  : plural(quizCount, 'cuestionario guardado', 'cuestionarios guardados')
            }
            onPress={() => router.push({ pathname: '/note/[id]/quizzes', params: { id } })}
          />
          <StudyAction
            icon="chat"
            title="Asistente de estudio"
            subtitle="Pregunta lo que no entiendas de este apunte"
            onPress={() => router.push({ pathname: '/note/[id]/assistant', params: { id } })}
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle">Apunte</ThemedText>
          <Card>
            {note.content ? (
              <ThemedText selectable>{note.content}</ThemedText>
            ) : (
              <ThemedText themeColor="textSecondary">
                Este apunte está vacío. Edítalo para agregar contenido.
              </ThemedText>
            )}
          </Card>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  subjectChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    maxWidth: '100%',
  },
  subjectChipText: {
    color: '#FFFFFF',
  },
});
