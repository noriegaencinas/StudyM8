import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { confirmAction, showMessage } from '@/lib/dialogs';
import { formatDate, plural } from '@/lib/format';
import type { QuizSummary } from '@/lib/types';

export default function QuizzesScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: quizzes, error, refreshing, refresh, reload } = useResource(
    `quizzes-${id}`,
    () => api.listQuizzes(id),
  );

  const generate = () => router.push({ pathname: '/note/[id]/generate-quiz', params: { id } });

  if (!quizzes) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  if (quizzes.length === 0) {
    return (
      <EmptyView
        icon="quiz"
        title="Ponte a prueba"
        message="Crea un cuestionario de opción múltiple a partir de este apunte y comprueba cuánto aprendiste."
        action={<Button title="Crear con IA" icon="sparkles" onPress={generate} />}
      />
    );
  }

  async function handleDelete(quiz: QuizSummary) {
    const confirmed = await confirmAction({
      title: '¿Eliminar cuestionario?',
      message: `Se eliminará "${quiz.title}".`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api.deleteQuiz(quiz.id);
      await reload();
    } catch (deleteError) {
      showMessage('No se pudo eliminar', errorMessage(deleteError));
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button title="Crear cuestionario con IA" icon="sparkles" onPress={generate} />
      {quizzes.map((quiz) => (
        <QuizRow key={quiz.id} quiz={quiz} onDelete={() => handleDelete(quiz)} />
      ))}
    </Screen>
  );
}

function QuizRow({ quiz, onDelete }: { quiz: QuizSummary; onDelete: () => void }) {
  const colors = useTheme();
  return (
    <Card
      accessibilityLabel={`Cuestionario ${quiz.title}`}
      onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: quiz.id } })}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <ThemedText type="defaultBold">{quiz.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {plural(quiz.question_count, 'pregunta', 'preguntas')} · {formatDate(quiz.created_at)}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar cuestionario"
          hitSlop={8}
          onPress={onDelete}>
          <Icon name="trash" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
});
