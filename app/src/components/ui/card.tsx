import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, accessibilityLabel, style }: CardProps) {
  const colors = useTheme();
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
});
