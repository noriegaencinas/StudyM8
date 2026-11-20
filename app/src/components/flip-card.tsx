import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FlipCardProps = {
  front: string;
  back: string;
  flipped: boolean;
  onPress: () => void;
};

/** Tarjeta de memoria que gira para mostrar la respuesta. */
export function FlipCard({ front, back, flipped, onPress }: FlipCardProps) {
  const colors = useTheme();
  const rotation = useSharedValue(flipped ? 180 : 0);

  useEffect(() => {
    rotation.set(withTiming(flipped ? 180 : 0, { duration: 350 }));
  }, [flipped, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.get()}deg` }],
    opacity: interpolate(rotation.get(), [89, 90], [1, 0], 'clamp'),
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${rotation.get() - 180}deg` }],
    opacity: interpolate(rotation.get(), [90, 91], [0, 1], 'clamp'),
  }));

  const faceStyle = [
    styles.face,
    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={flipped ? `Respuesta: ${back}` : `Pregunta: ${front}`}
      accessibilityHint="Toca para voltear la tarjeta"
      onPress={onPress}
      style={styles.container}>
      <Animated.View style={[faceStyle, frontStyle]} pointerEvents="none">
        <ThemedText type="caption" themeColor="primary">
          PREGUNTA
        </ThemedText>
        <ThemedText type="subtitle" style={styles.text}>
          {front}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Toca para ver la respuesta
        </ThemedText>
      </Animated.View>
      <Animated.View
        style={[faceStyle, styles.backFace, { borderColor: colors.primary }, backStyle]}
        pointerEvents="none">
        <ThemedText type="caption" themeColor="primary">
          RESPUESTA
        </ThemedText>
        <ThemedText style={styles.text}>{back}</ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
  },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backfaceVisibility: 'hidden',
  },
  backFace: {
    borderWidth: 2,
  },
  text: {
    textAlign: 'center',
  },
});
