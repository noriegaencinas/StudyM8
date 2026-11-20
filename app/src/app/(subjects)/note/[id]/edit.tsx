import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { NoteForm } from '@/components/note-form';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api, errorMessage } from '@/lib/api';
import { confirmAction, showMessage } from '@/lib/dialogs';

export default function EditNoteScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: note, error, reload } = useResource(`note-${id}`, () => api.getNote(id));
  const [deleting, setDeleting] = useState(false);

  if (!note) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  async function handleDelete() {
    if (!note) return;
    const confirmed = await confirmAction({
      title: '¿Eliminar apunte?',
      message: `Se eliminarán "${note.title}" y sus tarjetas y cuestionarios. No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteNote(id);
      router.dismissTo({ pathname: '/subject/[id]', params: { id: note.subject_id } });
    } catch (deleteError) {
      setDeleting(false);
      showMessage('No se pudo eliminar', errorMessage(deleteError));
    }
  }

  return (
    <Screen keyboard>
      <NoteForm
        key={note.id}
        initial={note}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          await api.updateNote(id, input);
          router.back();
        }}
      />
      <Button
        title="Eliminar apunte"
        icon="trash"
        variant="danger"
        loading={deleting}
        onPress={handleDelete}
      />
    </Screen>
  );
}
