import { router } from 'expo-router';

import { SubjectForm } from '@/components/subject-form';
import { Screen } from '@/components/ui/screen';
import { api } from '@/lib/api';

export default function NewSubjectScreen() {
  return (
    <Screen keyboard>
      <SubjectForm
        submitLabel="Crear materia"
        onSubmit={async (input) => {
          const subject = await api.createSubject(input);
          router.replace({ pathname: '/subject/[id]', params: { id: subject.id } });
        }}
      />
    </Screen>
  );
}
