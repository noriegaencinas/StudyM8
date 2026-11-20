import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { QuestionDraft } from '@/lib/types';

const LETTERS = ['A', 'B', 'C', 'D'];

type QuestionViewProps = {
  question: QuestionDraft;
  /** Opción elegida; `null` mientras el estudiante no responde. */
  selected: number | null;
  onSelect?: (index: number) => void;
  /** Muestra la respuesta correcta y la explicación. */
  revealed: boolean;
};

export function QuestionView({ question, selected, onSelect, revealed }: QuestionViewProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="caption" themeColor="primary">
        {question.topic.toUpperCase()}
      </ThemedText>
      <ThemedText type="subtitle">{question.prompt}</ThemedText>

      <View style={styles.options}>
        {question.options.map((option, index) => {
          const isCorrect = index === question.correct_index;
          const isSelected = index === selected;
          let tone: { border: ThemeColor; background: ThemeColor } = {
            border: isSelected ? 'primary' : 'border',
            background: isSelected ? 'primarySoft' : 'backgroundElement',
          };
          if (revealed && isCorrect) tone = { border: 'success', background: 'successSoft' };
          else if (revealed && isSelected) tone = { border: 'danger', background: 'dangerSoft' };

          return (
            <Pressable
              key={index}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: revealed || !onSelect }}
              accessibilityLabel={`Opción ${LETTERS[index]}: ${option}`}
              disabled={revealed || !onSelect}
              onPress={() => onSelect?.(index)}
              style={({ pressed }) => [
                styles.option,
                { borderColor: colors[tone.border], backgroundColor: colors[tone.background] },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.letter, { borderColor: colors[tone.border] }]}>
                <ThemedText type="smallBold">{LETTERS[index]}</ThemedText>
              </View>
              <ThemedText style={styles.optionText}>{option}</ThemedText>
              {revealed && isCorrect && <Icon name="checkCircle" color={colors.success} />}
              {revealed && isSelected && !isCorrect && (
                <Icon name="xCircle" color={colors.danger} />
              )}
            </Pressable>
          );
        })}
      </View>

      {revealed && question.explanation ? (
        <View style={[styles.explanation, { backgroundColor: colors.backgroundSelected }]}>
          <ThemedText type="smallBold">Explicación</ThemedText>
          <ThemedText type="small">{question.explanation}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  explanation: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
