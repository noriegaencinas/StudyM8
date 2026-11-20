import { router, useLocalSearchParams } from 'expo-router';

import { NoteForm } from '@/components/note-form';
import { Screen } from '@/components/ui/screen';
import { api } from '@/lib/api';

export default function NewNoteScreen() {
  const subjectId = Number(useLocalSearchParams<{ subjectId: string }>().subjectId);

  return (
    <Screen keyboard>
      <NoteForm
        submitLabel="Guardar apunte"
        onSubmit={async (input) => {
          const note = await api.createNote(subjectId, input);
          router.replace({ pathname: '/note/[id]', params: { id: note.id } });
        }}
      />
    </Screen>
  );
}
