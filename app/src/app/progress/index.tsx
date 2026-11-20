import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Meter } from '@/components/ui/meter';
import { Screen } from '@/components/ui/screen';
import { StatTile } from '@/components/ui/stat-tile';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatDate, plural } from '@/lib/format';
import type { Progress, SubjectRef } from '@/lib/types';

const percentText = (value: number | null) => (value === null ? '—' : `${value}%`);

export default function ProgressScreen() {
  const { data, error, refreshing, refresh, reload } = useResource('progress', api.getProgress);

  if (!data) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  const { totals } = data;
  if (totals.attempts === 0 && totals.flashcards_reviewed === 0) {
    return (
      <EmptyView
        icon="chart"
        title="Tu progreso aparecerá aquí"
        message="Resuelve cuestionarios y repasa tarjetas para ver tu dominio por materia y los temas que conviene reforzar."
        action={<Button title="Ir a mis materias" icon="book" onPress={() => router.navigate('/')} />}
      />
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.tiles}>
        <StatTile
          label="Dominio promedio"
          value={percentText(totals.mastery_percent)}
          detail="Último intento de cada cuestionario"
        />
        <StatTile
          label="Cuestionarios resueltos"
          value={String(totals.attempts)}
          detail={plural(totals.quizzes, 'cuestionario creado', 'cuestionarios creados')}
        />
        <StatTile
          label="Tarjetas repasadas"
          value={`${totals.flashcards_reviewed}/${totals.flashcards}`}
          detail={
            totals.flashcard_recall_percent === null
              ? 'Aún sin repasos'
              : `Las recuerdas el ${totals.flashcard_recall_percent}% de las veces`
          }
        />
      </View>

      {totals.attempts > 0 && <WeakTopics topics={data.weak_topics} />}
      <SubjectsSection subjects={data.subjects} />
      {data.recent_attempts.length > 0 && <RecentAttempts attempts={data.recent_attempts} />}
    </Screen>
  );
}

function SectionTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      {children}
      <ThemedText type="subtitle">{title}</ThemedText>
    </View>
  );
}

function WeakTopics({ topics }: { topics: Progress['weak_topics'] }) {
  const colors = useTheme();

  return (
    <View style={styles.section}>
      <SectionTitle title="Temas para reforzar">
        <Icon name="warning" size={20} color={colors.warning} />
      </SectionTitle>
      {topics.length === 0 ? (
        <Card>
          <View style={styles.inline}>
            <Icon name="checkCircle" color={colors.success} />
            <ThemedText style={styles.flex}>
              ¡Vas muy bien! Ningún tema está por debajo del 70% de aciertos.
            </ThemedText>
          </View>
        </Card>
      ) : (
        <Card>
          <ThemedText type="caption" themeColor="textSecondary">
            Aciertos por tema en tu último intento de cada cuestionario. Toca un tema para repasar el
            apunte.
          </ThemedText>
          {topics.map((topic) => (
            <Pressable
              key={`${topic.subject.id}-${topic.topic}`}
              accessibilityRole="button"
              accessibilityLabel={`${topic.topic}, ${topic.subject.name}: ${topic.correct} de ${topic.total} correctas`}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: topic.note_id } })}
              style={({ pressed }) => [styles.meterRow, pressed && styles.pressed]}>
              <View style={styles.meterHeader}>
                <View style={styles.flex}>
                  <ThemedText type="defaultBold" numberOfLines={1}>
                    {topic.topic}
                  </ThemedText>
                  <SubjectLabel subject={topic.subject} />
                </View>
                <ThemedText type="smallBold">{topic.percent}%</ThemedText>
              </View>
              <Meter
                percent={topic.percent}
                tone="warning"
                label={`${topic.topic}: ${topic.percent}% de aciertos`}
              />
              <ThemedText type="caption" themeColor="textSecondary">
                {topic.correct} de {plural(topic.total, 'pregunta correcta', 'preguntas correctas')}
              </ThemedText>
            </Pressable>
          ))}
        </Card>
      )}
    </View>
  );
}

function SubjectsSection({ subjects }: { subjects: Progress['subjects'] }) {
  if (subjects.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionTitle title="Dominio por materia" />
      <Card>
        {subjects.map((subject) => (
          <View key={subject.id} style={styles.meterRow}>
            <View style={styles.meterHeader}>
              <View style={[styles.flex, styles.inline]}>
                <View style={[styles.dot, { backgroundColor: subject.color }]} />
                <ThemedText type="defaultBold" numberOfLines={1} style={styles.flex}>
                  {subject.name}
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{percentText(subject.mastery_percent)}</ThemedText>
            </View>
            <Meter
              percent={subject.mastery_percent}
              label={`${subject.name}: dominio ${percentText(subject.mastery_percent)}`}
            />
            <ThemedText type="caption" themeColor="textSecondary">
              {subject.last_attempt_at === null
                ? `${plural(subject.note_count, 'apunte', 'apuntes')} · Sin cuestionarios resueltos`
                : `${plural(subject.attempt_count, 'intento', 'intentos')} · Último el ${formatDate(subject.last_attempt_at)}`}
            </ThemedText>
          </View>
        ))}
      </Card>
    </View>
  );
}

function RecentAttempts({ attempts }: { attempts: Progress['recent_attempts'] }) {
  return (
    <View style={styles.section}>
      <SectionTitle title="Intentos recientes" />
      {attempts.map((attempt) => (
        <Card
          key={attempt.id}
          accessibilityLabel={`${attempt.quiz_title}: ${attempt.percent}%`}
          onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: attempt.quiz_id } })}>
          <View style={styles.inline}>
            <View style={styles.flex}>
              <ThemedText type="defaultBold" numberOfLines={1}>
                {attempt.quiz_title}
              </ThemedText>
              <SubjectLabel subject={attempt.subject} extra={formatDate(attempt.created_at)} />
            </View>
            <View style={styles.score}>
              <ThemedText type="subtitle">{attempt.percent}%</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {attempt.score}/{attempt.total}
              </ThemedText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function SubjectLabel({ subject, extra }: { subject: SubjectRef; extra?: string }) {
  return (
    <View style={styles.inline}>
      <View style={[styles.smallDot, { backgroundColor: subject.color }]} />
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
        {subject.name}
        {extra ? ` · ${extra}` : ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  meterRow: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  smallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  score: {
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.7,
  },
});
