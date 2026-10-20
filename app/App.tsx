import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StudyMate</Text>
      <Text style={styles.subtitle}>Tu tutor universitario con IA</Text>
      <Text style={styles.caption}>Backend: {API_URL}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#334155',
  },
  caption: {
    fontSize: 12,
    marginTop: 24,
    color: '#94A3B8',
  },
});
