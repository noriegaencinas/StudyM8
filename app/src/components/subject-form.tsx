import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { SubjectColors, Spacing } from '@/constants/theme';
import { ApiError, errorMessage } from '@/lib/api';
import { showMessage } from '@/lib/dialogs';
import type { SubjectInput } from '@/lib/types';

type SubjectFormProps = {
  initial?: SubjectInput;
  submitLabel: string;
  onSubmit: (input: SubjectInput) => Promise<void>;
};

export function SubjectForm({ initial, submitLabel, onSubmit }: SubjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? SubjectColors[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      setErrors({ name: 'Escribe el nombre de la materia.' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), color });
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
        label="Nombre"
        placeholder="Por ejemplo: Cálculo diferencial"
        value={name}
        onChangeText={setName}
        error={errors.name}
        maxLength={100}
        autoFocus={!initial}
        returnKeyType="next"
      />
      <TextField
        label="Descripción (opcional)"
        placeholder="Profesor, semestre, horario…"
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        maxLength={500}
      />
      <View style={styles.colors}>
        <ThemedText type="smallBold">Color</ThemedText>
        <View style={styles.swatches}>
          {SubjectColors.map((swatch) => (
            <Pressable
              key={swatch}
              accessibilityRole="radio"
              accessibilityLabel={`Color ${swatch}`}
              accessibilityState={{ selected: swatch === color }}
              onPress={() => setColor(swatch)}
              style={[styles.swatch, { backgroundColor: swatch }]}>
              {swatch === color && <Icon name="check" size={18} color="#FFFFFF" />}
            </Pressable>
          ))}
        </View>
      </View>
      <Button title={submitLabel} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  colors: {
    gap: Spacing.two,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
