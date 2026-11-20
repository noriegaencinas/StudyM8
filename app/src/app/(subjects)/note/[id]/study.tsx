import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FlipCard } from '@/components/flip-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { Flashcard } from '@/lib/types';

/** Primero las tarjetas que más se fallan, luego las nuevas y al final las ya dominadas. */
function studyOrder(cards: Flashcard[]): Flashcard[] {
  const score = (card: Flashcard) => card.unknown_count - card.known_count;
  return [...cards].sort((a, b) => score(b) - score(a) || a.id - b.id);
}

type Session = {
  deck: Flashcard[];
  position: number;
  known: number;
  flipped: boolean;
};

function newSession(cards: Flashcard[]): Session {
  return { deck: studyOrder(cards), position: 0, known: 0, flipped: false };
}

export default function StudyScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: cards, error, reload } = useResource(`flashcards-${id}`, () =>
    api.listFlashcards(id),
  );
  const [session, setSession] = useState<Session | null>(null);

  // El mazo se fija al cargar las tarjetas, para que no cambie si se recargan a mitad del repaso.
  if (cards && cards.length > 0 && session === null) {
    setSession(newSession(cards));
  }

  if (!cards) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }
  if (cards.length === 0) {
    return (
      <EmptyView icon="cards" title="No hay tarjetas" message="Genera tarjetas para repasar." />
    );
  }
  if (!session) {
    return <LoadingView />;
  }

  const current = session;
  const restart = () => {
    void reload();
    setSession(null);
  };

  if (current.position >= current.deck.length) {
    return <Summary known={current.known} total={current.deck.length} onRestart={restart} />;
  }

  const card = current.deck[current.position];

  function answer(known: boolean) {
    // El registro del repaso no bloquea la sesión; si falla, se pierde solo esa marca.
    void api.reviewFlashcard(card.id, known).catch(() => undefined);
    setSession({
      ...current,
      position: current.position + 1,
      known: current.known + (known ? 1 : 0),
      flipped: false,
    });
  }

  return (
    <>
      <Stack.Screen
        options={{ title: `${current.position + 1} de ${current.deck.length}` }}
      />
      <Screen>
        <ProgressBar value={current.position / current.deck.length} />
        <FlipCard
          key={card.id}
          front={card.front}
          back={card.back}
          flipped={current.flipped}
          onPress={() => setSession({ ...current, flipped: !current.flipped })}
        />
        {current.flipped ? (
          <View style={styles.answers}>
            <Button
              title="No me la sabía"
              variant="danger"
              style={styles.answer}
              onPress={() => answer(false)}
            />
            <Button
              title="Me la sabía"
              icon="check"
              style={styles.answer}
              onPress={() => answer(true)}
            />
          </View>
        ) : (
          <Button
            title="Mostrar respuesta"
            icon="flip"
            variant="secondary"
            onPress={() => setSession({ ...current, flipped: true })}
          />
        )}
      </Screen>
    </>
  );
}

function ProgressBar({ value }: { value: number }) {
  const colors = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.backgroundSelected }]}>
      <View
        style={[styles.fill, { backgroundColor: colors.primary, width: `${value * 100}%` }]}
      />
    </View>
  );
}

function Summary({
  known,
  total,
  onRestart,
}: {
  known: number;
  total: number;
  onRestart: () => void;
}) {
  const percent = Math.round((known / total) * 100);
  const message =
    percent >= 80
      ? '¡Excelente! Dominas este tema.'
      : percent >= 50
        ? 'Vas bien. Repasa las que fallaste.'
        : 'Sigue practicando: repasar seguido es la clave.';

  return (
    <EmptyView
      icon="trophy"
      title={`Te sabías ${known} de ${total}`}
      message={message}
      action={
        <View style={styles.summaryActions}>
          <Button title="Repasar de nuevo" icon="refresh" onPress={onRestart} />
          <Button title="Volver" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  answers: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  answer: {
    flex: 1,
    paddingHorizontal: Spacing.two,
  },
  track: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  summaryActions: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
});
