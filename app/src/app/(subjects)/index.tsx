import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { plural } from '@/lib/format';
import type { Subject } from '@/lib/types';

function goToNewSubject() {
  router.push('/subject/new');
}

export default function SubjectsScreen() {
  const { data: subjects, error, refreshing, refresh, reload } = useResource(
    'subjects',
    api.listSubjects,
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton icon="add" label="Nueva materia" onPress={goToNewSubject} />
          ),
        }}
      />
      {subjects ? (
        subjects.length === 0 ? (
          <EmptyView
            icon="school"
            title="Empieza con tu primera materia"
            message="Crea una materia para guardar tus apuntes y estudiar con tarjetas y cuestionarios."
            action={<Button title="Nueva materia" icon="add" onPress={goToNewSubject} />}
          />
        ) : (
          <Screen refreshing={refreshing} onRefresh={refresh}>
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </Screen>
        )
      ) : error ? (
        <ErrorView error={error} onRetry={reload} />
      ) : (
        <LoadingView />
      )}
    </>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const colors = useTheme();

  return (
    <Card
      accessibilityLabel={`Materia ${subject.name}`}
      onPress={() => router.push({ pathname: '/subject/[id]', params: { id: subject.id } })}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: subject.color }]} />
        <View style={styles.texts}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {subject.name}
          </ThemedText>
          {subject.description ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {subject.description}
            </ThemedText>
          ) : null}
          <ThemedText type="caption" themeColor="textSecondary">
            {plural(subject.note_count, 'apunte', 'apuntes')}
          </ThemedText>
        </View>
        <Icon name="chevronRight" size={16} color={colors.textSecondary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
});
