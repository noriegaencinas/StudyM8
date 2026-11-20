import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MeterProps = {
  /** Porcentaje de 0 a 100; `null` dibuja solo el riel (sin datos). */
  percent: number | null;
  tone?: 'primary' | 'warning';
  label: string;
};

/** Barra horizontal de porcentaje: el riel es un tono claro de la misma rampa que el relleno. */
export function Meter({ percent, tone = 'primary', label }: MeterProps) {
  const colors = useTheme();
  const fill = tone === 'warning' ? colors.warning : colors.primary;
  const track = tone === 'warning' ? colors.warningSoft : colors.primarySoft;
  const value = percent === null ? 0 : Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={percent === null ? undefined : { min: 0, max: 100, now: value }}
      style={[styles.track, { backgroundColor: track }]}>
      {value > 0 && <View style={[styles.fill, { width: `${value}%`, backgroundColor: fill }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
