import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SubjectForm } from '@/components/subject-form';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { ErrorView, LoadingView } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api, errorMessage } from '@/lib/api';
import { confirmAction, showMessage } from '@/lib/dialogs';

export default function EditSubjectScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { data: subject, error, reload } = useResource(`subject-${id}`, () => api.getSubject(id));
  const [deleting, setDeleting] = useState(false);

  if (!subject) {
    return error ? <ErrorView error={error} onRetry={reload} /> : <LoadingView />;
  }

  async function handleDelete() {
    const confirmed = await confirmAction({
      title: '¿Eliminar materia?',
      message: `Se eliminarán "${subject?.name}" y todos sus apuntes, tarjetas y cuestionarios. No se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteSubject(id);
      router.dismissTo('/');
    } catch (deleteError) {
      setDeleting(false);
      showMessage('No se pudo eliminar', errorMessage(deleteError));
    }
  }

  return (
    <Screen keyboard>
      <SubjectForm
        key={subject.id}
        initial={subject}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          await api.updateSubject(id, input);
          router.back();
        }}
      />
      <Button
        title="Eliminar materia"
        icon="trash"
        variant="danger"
        loading={deleting}
        onPress={handleDelete}
      />
    </Screen>
  );
}
