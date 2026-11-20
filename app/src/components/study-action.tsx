import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StudyActionProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function StudyAction({ icon, title, subtitle, onPress }: StudyActionProps) {
  const colors = useTheme();

  return (
    <Card accessibilityLabel={title} onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
          <Icon name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.texts}>
          <ThemedText type="defaultBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
        <Icon name="chevronRight" size={16} color={colors.textSecondary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
});
