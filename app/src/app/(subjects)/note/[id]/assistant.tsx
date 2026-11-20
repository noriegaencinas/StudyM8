import { Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, errorMessage } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';

const SUGGESTIONS = [
  'Explícame este tema con palabras sencillas',
  '¿Cuáles son las ideas clave?',
  'Dame un ejemplo práctico',
  'Hazme una pregunta para ver si entendí',
];

/** Mensajes que se envían como contexto (el backend acepta hasta 30). */
const HISTORY_LIMIT = 20;
const MAX_MESSAGE_LENGTH = 4000;

function recentHistory(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-HISTORY_LIMIT);
  // La conversación enviada debe empezar con un mensaje del estudiante.
  const firstUser = recent.findIndex((message) => message.role === 'user');
  return firstUser > 0 ? recent.slice(firstUser) : recent;
}

export default function AssistantScreen() {
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const colors = useTheme();
  const headerHeight = useHeaderHeight();
  const keyboardVisible = useKeyboardVisible();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const { data: note } = useResource(`note-${id}`, () => api.getNote(id));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(history: ChatMessage[]) {
    setError(null);
    setPending(true);
    try {
      const { reply } = await api.askAssistant(id, recentHistory(history));
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch (askError) {
      setError(errorMessage(askError));
    } finally {
      setPending(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const history: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(history);
    setDraft('');
    void ask(history);
  }

  const canSend = draft.trim().length > 0 && !pending;

  return (
    <>
      <Stack.Screen options={{ title: 'Asistente' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.length === 0 && (
            <View style={styles.intro}>
              <Icon name="chat" size={40} color={colors.primary} />
              <ThemedText type="subtitle" style={styles.center}>
                Pregunta sobre {note ? `«${note.title}»` : 'tu apunte'}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                El asistente responde a partir de tu apunte y te avisa cuando algo no aparece en
                él.
              </ThemedText>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    onPress={() => send(suggestion)}
                    style={({ pressed }) => [
                      styles.suggestion,
                      { borderColor: colors.primary },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small" themeColor="primary">
                      {suggestion}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((message, index) => (
            <Bubble key={index} message={message} />
          ))}

          {pending && (
            <View
              style={[styles.bubble, styles.assistant, { backgroundColor: colors.backgroundElement }]}>
              <View style={styles.thinking}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText type="small" themeColor="textSecondary">
                  Pensando…
                </ThemedText>
              </View>
            </View>
          )}

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft }]}>
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
              <Button
                title="Reintentar"
                icon="refresh"
                variant="ghost"
                onPress={() => void ask(messages)}
              />
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: (keyboardVisible ? 0 : BottomTabInset) + Spacing.two,
            },
          ]}>
          <TextInput
            accessibilityLabel="Escribe tu pregunta"
            placeholder="Escribe tu pregunta…"
            placeholderTextColor={colors.textSecondary}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => send(draft)}
            style={[
              styles.send,
              { backgroundColor: colors.primary },
              !canSend && styles.disabled,
            ]}>
            <Icon name="send" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const colors = useTheme();
  const isUser = message.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.user : styles.assistant,
        { backgroundColor: isUser ? colors.primary : colors.backgroundElement },
      ]}>
      <ThemedText selectable themeColor={isUser ? 'onPrimary' : 'text'}>
        {message.content}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  messages: {
    flexGrow: 1,
    gap: Spacing.two,
    padding: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  suggestions: {
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  suggestion: {
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radius.large,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  user: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: Radius.small / 2,
  },
  assistant: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: Radius.small / 2,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorBox: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 16,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
