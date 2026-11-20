import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * En web el HTML se genera en el servidor, donde no se conoce el tema del usuario.
 * Devuelve 'light' hasta que la app se hidrata en el navegador.
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();

  return hydrated ? colorScheme : 'light';
}
