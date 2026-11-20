import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SegmentedProps<T extends string | number> = {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
};

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format = String,
}: SegmentedProps<T>) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        accessibilityRole="radiogroup"
        style={[styles.track, { backgroundColor: colors.backgroundSelected }]}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[
                styles.segment,
                selected && { backgroundColor: colors.backgroundElement },
              ]}>
              <ThemedText type="smallBold" themeColor={selected ? 'primary' : 'textSecondary'}>
                {format(option)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.medium,
    padding: Spacing.half,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
  },
});
