import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuestionView } from '@/components/question-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { Quiz } from '@/lib/types';

export default function QuizScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: quiz, error, reload } = useResource(`quiz-${id}`, () => api.getQuiz(id));
  // Respuesta elegida en cada pregunta (null = sin responder).
  const [answers, setAnswers] = useState<(number | null)[] | null>(null);
  const [position, setPosition] = useState(0);

  if (!quiz) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  const current = answers ?? quiz.questions.map(() => null);
  const total = quiz.questions.length;

  if (position >= total) {
    return (
      <Results
        quiz={quiz}
        answers={current}
        onRetry={() => {
          setAnswers(null);
          setPosition(0);
        }}
      />
    );
  }

  const question = quiz.questions[position];
  const selected = current[position];
  const answered = selected !== null;
  const isLast = position === total - 1;

  return (
    <>
      <Stack.Screen options={{ title: `Pregunta ${position + 1} de ${total}` }} />
      <Screen>
        <ProgressDots answers={current} quiz={quiz} position={position} />
        <QuestionView
          question={question}
          selected={selected}
          revealed={answered}
          onSelect={(index) =>
            setAnswers(current.map((value, i) => (i === position ? index : value)))
          }
        />
        {answered && (
          <Button
            title={isLast ? 'Ver resultados' : 'Siguiente pregunta'}
            onPress={() => setPosition(position + 1)}
          />
        )}
      </Screen>
    </>
  );
}

function ProgressDots({
  quiz,
  answers,
  position,
}: {
  quiz: Quiz;
  answers: (number | null)[];
  position: number;
}) {
  const colors = useTheme();
  return (
    <View style={styles.dots}>
      {quiz.questions.map((question, index) => {
        const answer = answers[index];
        const color =
          answer === null
            ? index === position
              ? colors.primary
              : colors.backgroundSelected
            : answer === question.correct_index
              ? colors.success
              : colors.danger;
        return <View key={question.id} style={[styles.dot, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

function Results({
  quiz,
  answers,
  onRetry,
}: {
  quiz: Quiz;
  answers: (number | null)[];
  onRetry: () => void;
}) {
  const colors = useTheme();
  const total = quiz.questions.length;
  const correct = quiz.questions.filter((q, i) => answers[i] === q.correct_index).length;
  const percent = Math.round((correct / total) * 100);
  const missed = quiz.questions.filter((q, i) => answers[i] !== q.correct_index);
  const weakTopics = [...new Set(missed.map((q) => q.topic))];
  const tone = percent >= 80 ? colors.success : percent >= 50 ? colors.warning : colors.danger;

  return (
    <>
      <Stack.Screen options={{ title: 'Resultados' }} />
      <Screen>
        <Card style={styles.scoreCard}>
          <ThemedText type="caption" themeColor="textSecondary">
            {quiz.title.toUpperCase()}
          </ThemedText>
          <ThemedText style={[styles.score, { color: tone }]}>{percent}%</ThemedText>
          <ThemedText type="defaultBold">
            {correct} de {total} respuestas correctas
          </ThemedText>
        </Card>

        {weakTopics.length > 0 ? (
          <Card>
            <ThemedText type="defaultBold">Temas para reforzar</ThemedText>
            {weakTopics.map((topic) => (
              <ThemedText key={topic} themeColor="textSecondary">
                • {topic}
              </ThemedText>
            ))}
          </Card>
        ) : (
          <Card>
            <ThemedText type="defaultBold">¡Perfecto! Respondiste todo bien.</ThemedText>
          </Card>
        )}

        {missed.length > 0 && (
          <View style={styles.review}>
            <ThemedText type="subtitle">Repasa tus errores</ThemedText>
            {missed.map((question) => (
              <Card key={question.id}>
                <QuestionView
                  question={question}
                  selected={answers[quiz.questions.indexOf(question)]}
                  revealed
                />
              </Card>
            ))}
          </View>
        )}

        <Button title="Intentar de nuevo" icon="refresh" onPress={onRetry} />
        <Button title="Volver" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  dot: {
    flexGrow: 1,
    minWidth: 12,
    height: 6,
    borderRadius: Radius.pill,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  score: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: 800,
  },
  review: {
    gap: Spacing.two,
  },
});
