import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type State<T> = {
  key: string;
  data?: T;
  error?: Error;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Ocurrió un error inesperado.');
}

/**
 * Carga datos del backend cada vez que la pantalla recibe el foco, para que
 * los cambios hechos en otras pantallas se vean al volver.
 *
 * `key` identifica el recurso: si cambia, se descartan los datos anteriores.
 */
export function useResource<T>(key: string, fetcher: () => Promise<T>) {
  const [state, setState] = useState<State<T>>({ key });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ key, data });
    } catch (error) {
      setState((previous) => ({
        key,
        data: previous.key === key ? previous.data : undefined,
        error: toError(error),
      }));
    }
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isCurrent = state.key === key;
  const data = isCurrent ? state.data : undefined;
  const error = isCurrent ? state.error : undefined;

  return {
    data,
    error,
    loading: data === undefined && error === undefined,
    refreshing,
    refresh,
    reload: load,
  };
}
