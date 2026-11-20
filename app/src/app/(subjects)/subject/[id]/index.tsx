import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeaderButton } from '@/components/ui/header-button';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/states';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { formatDate, normalizeForSearch, plural } from '@/lib/format';
import type { NoteSummary } from '@/lib/types';

/** A partir de cuántos apuntes se muestra el buscador. */
const SEARCH_THRESHOLD = 4;

export default function SubjectScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const subject = useResource(`subject-${id}`, () => api.getSubject(id));
  const notes = useResource(`notes-${id}`, () => api.listNotes(id));
  const [query, setQuery] = useState('');

  const header = (
    <Stack.Screen
      options={{
        title: subject.data?.name ?? '',
        headerRight: () => (
          <HeaderButton
            icon="edit"
            label="Editar materia"
            onPress={() => router.push({ pathname: '/subject/[id]/edit', params: { id } })}
          />
        ),
      }}
    />
  );

  const error = subject.error ?? notes.error;
  if (!subject.data || !notes.data) {
    return (
      <>
        {header}
        {error ? (
          <ErrorView
            error={error}
            onRetry={() => {
              void subject.reload();
              void notes.reload();
            }}
          />
        ) : (
          <LoadingView />
        )}
      </>
    );
  }

  const newNote = () => router.push({ pathname: '/note/new', params: { subjectId: id } });
  const normalizedQuery = normalizeForSearch(query.trim());
  const visibleNotes = normalizedQuery
    ? notes.data.filter((note) =>
        normalizeForSearch(`${note.title} ${note.excerpt}`).includes(normalizedQuery),
      )
    : notes.data;

  return (
    <>
      {header}
      <Screen
        refreshing={notes.refreshing}
        onRefresh={() => {
          void subject.refresh();
          void notes.refresh();
        }}>
        <View style={styles.summary}>
          <View style={[styles.colorBar, { backgroundColor: subject.data.color }]} />
          <View style={styles.summaryText}>
            {subject.data.description ? (
              <ThemedText themeColor="textSecondary">{subject.data.description}</ThemedText>
            ) : null}
            <ThemedText type="caption" themeColor="textSecondary">
              {plural(notes.data.length, 'apunte', 'apuntes')}
            </ThemedText>
          </View>
        </View>

        <Button title="Nuevo apunte" icon="add" onPress={newNote} />

        {notes.data.length >= SEARCH_THRESHOLD && (
          <TextField
            label="Buscar"
            placeholder="Buscar en los apuntes…"
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        )}

        {notes.data.length === 0 ? (
          <EmptyView
            icon="note"
            title="Sin apuntes todavía"
            message="Agrega tus apuntes de clase para generar tarjetas y cuestionarios con IA."
          />
        ) : visibleNotes.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.noResults}>
            Ningún apunte coincide con “{query.trim()}”.
          </ThemedText>
        ) : (
          visibleNotes.map((note) => <NoteCard key={note.id} note={note} />)
        )}
      </Screen>
    </>
  );
}

function NoteCard({ note }: { note: NoteSummary }) {
  return (
    <Card
      accessibilityLabel={`Apunte ${note.title}`}
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}>
      <ThemedText type="defaultBold" numberOfLines={2}>
        {note.title}
      </ThemedText>
      {note.excerpt ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {note.excerpt}
        </ThemedText>
      ) : null}
      <ThemedText type="caption" themeColor="textSecondary">
        Actualizado el {formatDate(note.updated_at)}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
  },
  summaryText: {
    flex: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.half,
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
});
