import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, multiline, style, ...props }: TextFieldProps) {
  const colors = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            color: colors.text,
            backgroundColor: colors.backgroundElement,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <ThemedText type="caption" themeColor="danger">
          {error}
        </ThemedText>
      ) : (
        hint && (
          <ThemedText type="caption" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontFamily: Fonts?.sans,
  },
  multiline: {
    minHeight: 220,
    paddingTop: Spacing.three,
    lineHeight: 22,
  },
});
