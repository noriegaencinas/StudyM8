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
import { plural } from '@/lib/format';
import type { Flashcard } from '@/lib/types';

export default function FlashcardsScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: cards, error, refreshing, refresh, reload } = useResource(
    `flashcards-${id}`,
    () => api.listFlashcards(id),
  );

  const generate = () =>
    router.push({ pathname: '/note/[id]/generate-flashcards', params: { id } });

  if (!cards) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  if (cards.length === 0) {
    return (
      <EmptyView
        icon="cards"
        title="Aún no tienes tarjetas"
        message="StudyMate puede leer tu apunte y crear tarjetas con las ideas más importantes."
        action={<Button title="Generar con IA" icon="sparkles" onPress={generate} />}
      />
    );
  }

  async function handleDelete(card: Flashcard) {
    const confirmed = await confirmAction({
      title: '¿Eliminar tarjeta?',
      message: card.front,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api.deleteFlashcard(card.id);
      await reload();
    } catch (deleteError) {
      showMessage('No se pudo eliminar', errorMessage(deleteError));
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button
        title={`Repasar ${plural(cards.length, 'tarjeta', 'tarjetas')}`}
        icon="flip"
        onPress={() => router.push({ pathname: '/note/[id]/study', params: { id } })}
      />
      <Button title="Generar más con IA" icon="sparkles" variant="secondary" onPress={generate} />
      {cards.map((card) => (
        <FlashcardRow key={card.id} card={card} onDelete={() => handleDelete(card)} />
      ))}
    </Screen>
  );
}

function FlashcardRow({ card, onDelete }: { card: Flashcard; onDelete: () => void }) {
  const colors = useTheme();
  const reviews = card.known_count + card.unknown_count;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.texts}>
          <ThemedText type="defaultBold">{card.front}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {card.back}
          </ThemedText>
          {reviews > 0 && (
            <ThemedText type="caption" themeColor="textSecondary">
              Te la sabías {card.known_count} de {plural(reviews, 'vez', 'veces')}
            </ThemedText>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar tarjeta"
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
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
});
