import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuestionView } from '@/components/question-view';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { showMessage } from '@/lib/dialogs';
import { plural } from '@/lib/format';
import type { QuizDraft } from '@/lib/types';

const COUNTS = [5, 10, 15] as const;

type Step =
  | { kind: 'setup' }
  | { kind: 'generating' }
  | { kind: 'error'; error: Error }
  | { kind: 'ready'; draft: QuizDraft };

export default function GenerateQuizScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [count, setCount] = useState<(typeof COUNTS)[number]>(5);
  const [step, setStep] = useState<Step>({ kind: 'setup' });
  const [showAnswers, setShowAnswers] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setShowAnswers(false);
    setStep({ kind: 'generating' });
    try {
      setStep({ kind: 'ready', draft: await api.generateQuiz(id, count) });
    } catch (error) {
      setStep({ kind: 'error', error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  if (step.kind === 'generating') {
    return <LoadingView message="Creando preguntas a partir de tu apunte… Puede tardar un poco." />;
  }

  if (step.kind === 'error') {
    return <ErrorView error={step.error} onRetry={generate} />;
  }

  if (step.kind === 'setup') {
    return (
      <Screen>
        <View style={styles.intro}>
          <ThemedText type="subtitle">Crear cuestionario con IA</ThemedText>
          <ThemedText themeColor="textSecondary">
            StudyMate preparará preguntas de opción múltiple sobre el apunte. Tus resultados se
            guardan para que veas tu progreso.
          </ThemedText>
        </View>
        <Segmented
          label="¿Cuántas preguntas?"
          options={COUNTS}
          value={count}
          onChange={setCount}
        />
        <Button title="Crear cuestionario" icon="sparkles" onPress={generate} />
      </Screen>
    );
  }

  const { draft } = step;
  const topics = [...new Set(draft.questions.map((question) => question.topic))];

  async function saveAndStart() {
    setSaving(true);
    try {
      const quiz = await api.saveQuiz(id, draft);
      router.replace({ pathname: '/quiz/[id]', params: { id: quiz.id } });
    } catch (error) {
      setSaving(false);
      showMessage('No se pudo guardar', errorMessage(error));
    }
  }

  return (
    <Screen>
      <Card>
        <ThemedText type="subtitle">{draft.title}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {plural(draft.questions.length, 'pregunta', 'preguntas')} sobre: {topics.join(', ')}.
        </ThemedText>
      </Card>
      <Button title="Guardar y empezar" icon="quiz" onPress={saveAndStart} loading={saving} />
      <Button title="Generar otro" icon="refresh" variant="secondary" onPress={generate} />
      <Button
        title={showAnswers ? 'Ocultar preguntas' : 'Revisar preguntas (muestra las respuestas)'}
        variant="ghost"
        onPress={() => setShowAnswers(!showAnswers)}
      />
      {showAnswers &&
        draft.questions.map((question, index) => (
          <Card key={index}>
            <QuestionView question={question} selected={null} revealed />
          </Card>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: Spacing.two,
  },
});
