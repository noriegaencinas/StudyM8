import { API_URL } from './config';
import type {
  ChatMessage,
  Flashcard,
  FlashcardDraft,
  Note,
  NoteInput,
  NoteSummary,
  Progress,
  Quiz,
  QuizAttempt,
  QuizDraft,
  QuizSummary,
  Subject,
  SubjectInput,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
/** Las peticiones de IA pueden tardar bastante con apuntes largos. */
const AI_TIMEOUT_MS = 150_000;

async function request<T>(
  path: string,
  { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError(
        'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
        0,
        'timeout',
      );
    }
    throw new ApiError(
      `No se pudo conectar con el servidor (${API_URL}). Revisa que el backend esté encendido y en la misma red.`,
      0,
      'network_error',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as { error?: { message?: string; code?: string; fields?: Record<string, string> } })
      ?.error;
    throw new ApiError(
      error?.message ?? `Error ${response.status} del servidor.`,
      response.status,
      error?.code ?? 'http_error',
      error?.fields,
    );
  }
  return data as T;
}

export const api = {
  listSubjects: () => request<Subject[]>('/api/subjects'),
  getSubject: (id: number) => request<Subject>(`/api/subjects/${id}`),
  createSubject: (input: SubjectInput) =>
    request<Subject>('/api/subjects', { method: 'POST', body: input }),
  updateSubject: (id: number, input: Partial<SubjectInput>) =>
    request<Subject>(`/api/subjects/${id}`, { method: 'PATCH', body: input }),
  deleteSubject: (id: number) => request<void>(`/api/subjects/${id}`, { method: 'DELETE' }),

  listNotes: (subjectId: number) => request<NoteSummary[]>(`/api/subjects/${subjectId}/notes`),
  createNote: (subjectId: number, input: NoteInput) =>
    request<Note>(`/api/subjects/${subjectId}/notes`, { method: 'POST', body: input }),
  getNote: (id: number) => request<Note>(`/api/notes/${id}`),
  updateNote: (id: number, input: Partial<NoteInput>) =>
    request<Note>(`/api/notes/${id}`, { method: 'PATCH', body: input }),
  deleteNote: (id: number) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),

  generateFlashcards: (noteId: number, count: number) =>
    request<{ flashcards: FlashcardDraft[] }>(`/api/notes/${noteId}/flashcards/generate`, {
      method: 'POST',
      body: { count },
      timeoutMs: AI_TIMEOUT_MS,
    }),
  listFlashcards: (noteId: number) => request<Flashcard[]>(`/api/notes/${noteId}/flashcards`),
  saveFlashcards: (noteId: number, flashcards: FlashcardDraft[]) =>
    request<Flashcard[]>(`/api/notes/${noteId}/flashcards`, {
      method: 'POST',
      body: { flashcards },
    }),
  deleteFlashcard: (id: number) => request<void>(`/api/flashcards/${id}`, { method: 'DELETE' }),
  reviewFlashcard: (id: number, known: boolean) =>
    request<Flashcard>(`/api/flashcards/${id}/review`, { method: 'POST', body: { known } }),

  generateQuiz: (noteId: number, count: number) =>
    request<QuizDraft>(`/api/notes/${noteId}/quizzes/generate`, {
      method: 'POST',
      body: { count },
      timeoutMs: AI_TIMEOUT_MS,
    }),
  listQuizzes: (noteId: number) => request<QuizSummary[]>(`/api/notes/${noteId}/quizzes`),
  saveQuiz: (noteId: number, quiz: QuizDraft) =>
    request<Quiz>(`/api/notes/${noteId}/quizzes`, { method: 'POST', body: quiz }),
  getQuiz: (id: number) => request<Quiz>(`/api/quizzes/${id}`),
  deleteQuiz: (id: number) => request<void>(`/api/quizzes/${id}`, { method: 'DELETE' }),
  createAttempt: (quizId: number, answers: (number | null)[]) =>
    request<QuizAttempt>(`/api/quizzes/${quizId}/attempts`, {
      method: 'POST',
      body: { answers },
    }),

  getProgress: () => request<Progress>('/api/progress'),

  askAssistant: (noteId: number, messages: ChatMessage[]) =>
    request<{ reply: string }>(`/api/notes/${noteId}/assistant`, {
      method: 'POST',
      body: { messages },
      timeoutMs: AI_TIMEOUT_MS,
    }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}
