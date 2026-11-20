import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';

type HeaderButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

export function HeaderButton({ icon, label, onPress }: HeaderButtonProps) {
  const colors = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={icon} size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
});
