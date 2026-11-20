import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function SubjectsScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">StudyMate</ThemedText>
      <ThemedText themeColor="textSecondary">Tu tutor universitario con IA</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
});
