import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { ApiError, errorMessage } from '@/lib/api';
import { showMessage } from '@/lib/dialogs';
import type { NoteInput } from '@/lib/types';

type NoteFormProps = {
  initial?: NoteInput;
  submitLabel: string;
  onSubmit: (input: NoteInput) => Promise<void>;
};

export function NoteForm({ initial, submitLabel, onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      setErrors({ title: 'Escribe un título para el apunte.' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setErrors(error.fields);
      } else {
        showMessage('No se pudo guardar', errorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Título"
        placeholder="Por ejemplo: Derivadas parciales"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={200}
        autoFocus={!initial}
      />
      <TextField
        label="Contenido"
        placeholder="Escribe o pega aquí tus apuntes…"
        hint="StudyMate usará este texto para crear tarjetas, cuestionarios y explicaciones."
        value={content}
        onChangeText={setContent}
        error={errors.content}
        multiline
        maxLength={50_000}
      />
      <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
});
