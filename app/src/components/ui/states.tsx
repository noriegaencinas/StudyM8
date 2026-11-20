import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { Icon, type IconName } from './icon';

export function LoadingView({ message }: { message?: string }) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <ThemedText themeColor="textSecondary" style={styles.text}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      <Icon name="warning" size={40} color={colors.danger} />
      <ThemedText type="subtitle" style={styles.text}>
        Algo salió mal
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        {error.message}
      </ThemedText>
      {onRetry && <Button title="Reintentar" icon="refresh" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

type EmptyViewProps = {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyView({ icon, title, message, action }: EmptyViewProps) {
  const colors = useTheme();
  return (
    <View style={styles.center}>
      <Icon name={icon} size={44} color={colors.primary} />
      <ThemedText type="subtitle" style={styles.text}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        {message}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  text: {
    textAlign: 'center',
    maxWidth: 420,
  },
});
