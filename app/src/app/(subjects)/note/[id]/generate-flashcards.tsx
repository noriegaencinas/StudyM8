import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import { showMessage } from '@/lib/dialogs';
import { plural } from '@/lib/format';
import type { FlashcardDraft } from '@/lib/types';

const COUNTS = [5, 10, 15] as const;

type Step =
  | { kind: 'setup' }
  | { kind: 'generating' }
  | { kind: 'error'; error: Error }
  | { kind: 'review'; drafts: FlashcardDraft[]; selected: boolean[] };

export default function GenerateFlashcardsScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [count, setCount] = useState<(typeof COUNTS)[number]>(10);
  const [step, setStep] = useState<Step>({ kind: 'setup' });
  const [saving, setSaving] = useState(false);

  async function generate() {
    setStep({ kind: 'generating' });
    try {
      const { flashcards } = await api.generateFlashcards(id, count);
      setStep({ kind: 'review', drafts: flashcards, selected: flashcards.map(() => true) });
    } catch (error) {
      setStep({ kind: 'error', error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  if (step.kind === 'generating') {
    return <LoadingView message="Leyendo tu apunte y creando tarjetas… Puede tardar un poco." />;
  }

  if (step.kind === 'error') {
    return <ErrorView error={step.error} onRetry={generate} />;
  }

  if (step.kind === 'setup') {
    return (
      <Screen>
        <View style={styles.intro}>
          <ThemedText type="subtitle">Generar tarjetas con IA</ThemedText>
          <ThemedText themeColor="textSecondary">
            StudyMate leerá el apunte y propondrá tarjetas con las ideas principales. Podrás revisar
            cuáles guardar.
          </ThemedText>
        </View>
        <Segmented
          label="¿Cuántas tarjetas?"
          options={COUNTS}
          value={count}
          onChange={setCount}
        />
        <Button title="Generar tarjetas" icon="sparkles" onPress={generate} />
      </Screen>
    );
  }

  const { drafts, selected } = step;
  const chosen = drafts.filter((_, index) => selected[index]);

  function toggle(index: number) {
    setStep({ ...step, selected: selected.map((value, i) => (i === index ? !value : value)) } as Step);
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveFlashcards(id, chosen);
      router.back();
    } catch (error) {
      setSaving(false);
      showMessage('No se pudieron guardar', errorMessage(error));
    }
  }

  return (
    <Screen>
      <ThemedText themeColor="textSecondary">
        Toca una tarjeta para incluirla o quitarla. Se guardarán{' '}
        {plural(chosen.length, 'tarjeta', 'tarjetas')}.
      </ThemedText>
      {drafts.map((draft, index) => (
        <DraftRow
          key={index}
          draft={draft}
          selected={selected[index]}
          onToggle={() => toggle(index)}
        />
      ))}
      <Button
        title={`Guardar ${plural(chosen.length, 'tarjeta', 'tarjetas')}`}
        icon="check"
        onPress={save}
        loading={saving}
        disabled={chosen.length === 0}
      />
      <Button title="Generar de nuevo" icon="refresh" variant="ghost" onPress={generate} />
    </Screen>
  );
}

function DraftRow({
  draft,
  selected,
  onToggle,
}: {
  draft: FlashcardDraft;
  selected: boolean;
  onToggle: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onToggle}>
      <Card style={[!selected && styles.unselected, selected && { borderColor: colors.primary }]}>
        <View style={styles.row}>
          <View
            style={[
              styles.checkbox,
              { borderColor: selected ? colors.primary : colors.border },
              selected && { backgroundColor: colors.primary },
            ]}>
            {selected && <Icon name="check" size={14} color={colors.onPrimary} />}
          </View>
          <View style={styles.texts}>
            <ThemedText type="defaultBold">{draft.front}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {draft.back}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.small - 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  unselected: {
    opacity: 0.55,
  },
});
