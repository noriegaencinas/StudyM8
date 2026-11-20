import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 5000;

/**
 * URL del backend.
 *
 * 1. Si `EXPO_PUBLIC_API_URL` está definida (en app/.env), se usa tal cual.
 * 2. En el teléfono o emulador se usa la IP de la computadora que ejecuta `expo start`,
 *    así no hace falta configurar nada cuando ambos están en la misma red.
 * 3. En web se usa el mismo host que la página.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    const host = globalThis.location?.hostname || 'localhost';
    return `http://${host}:${BACKEND_PORT}`;
  }

  const devServerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${devServerHost || 'localhost'}:${BACKEND_PORT}`;
}

export const API_URL = resolveApiUrl();
