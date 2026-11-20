import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';

type StatTileProps = {
  label: string;
  value: string;
  detail?: string;
};

/** Indicador con una cifra principal (sin gráfico). */
export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <Card style={styles.tile}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {detail ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    gap: Spacing.one,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
});
