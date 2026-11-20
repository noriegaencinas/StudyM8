import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { HeaderButton } from '@/components/ui/header-button';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function NoteScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: note, error, refreshing, refresh, reload } = useResource(`note-${id}`, () =>
    api.getNote(id),
  );

  const header = (
    <Stack.Screen
      options={{
        title: note?.subject.name ?? '',
        headerRight: () => (
          <HeaderButton
            icon="edit"
            label="Editar apunte"
            onPress={() => router.push({ pathname: '/note/[id]/edit', params: { id } })}
          />
        ),
      }}
    />
  );

  if (!note) {
    return (
      <>
        {header}
        {error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />}
      </>
    );
  }

  return (
    <>
      {header}
      <Screen refreshing={refreshing} onRefresh={refresh}>
        <View style={styles.heading}>
          <View style={[styles.subjectChip, { backgroundColor: note.subject.color }]}>
            <ThemedText type="caption" style={styles.subjectChipText} numberOfLines={1}>
              {note.subject.name}
            </ThemedText>
          </View>
          <ThemedText type="title">{note.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Actualizado el {formatDate(note.updated_at)}
          </ThemedText>
        </View>

        <Card>
          {note.content ? (
            <ThemedText selectable>{note.content}</ThemedText>
          ) : (
            <ThemedText themeColor="textSecondary">
              Este apunte está vacío. Edítalo para agregar contenido.
            </ThemedText>
          )}
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.two,
  },
  subjectChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    maxWidth: '100%',
  },
  subjectChipText: {
    color: '#FFFFFF',
  },
});
