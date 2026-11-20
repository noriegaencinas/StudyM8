/** Tipos de los datos que devuelve el backend. Las fechas son cadenas ISO 8601 en UTC. */

export type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Subject = Timestamps & {
  id: number;
  name: string;
  description: string;
  color: string;
  note_count: number;
};

export type SubjectRef = Pick<Subject, 'id' | 'name' | 'color'>;

export type SubjectInput = {
  name: string;
  description: string;
  color: string;
};

export type NoteSummary = Timestamps & {
  id: number;
  subject_id: number;
  title: string;
  excerpt: string;
};

export type Note = NoteSummary & {
  content: string;
  subject: SubjectRef;
};

export type NoteInput = {
  title: string;
  content: string;
};

export type FlashcardDraft = {
  front: string;
  back: string;
};

export type Flashcard = Timestamps &
  FlashcardDraft & {
    id: number;
    note_id: number;
    known_count: number;
    unknown_count: number;
    last_reviewed_at: string | null;
  };

export type QuestionDraft = {
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  topic: string;
};

export type QuizDraft = {
  title: string;
  questions: QuestionDraft[];
};

export type QuizQuestion = QuestionDraft & { id: number };

export type QuizSummary = Timestamps & {
  id: number;
  note_id: number;
  title: string;
  question_count: number;
};

export type Quiz = QuizSummary & {
  note: { id: number; title: string };
  subject: SubjectRef;
  questions: QuizQuestion[];
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
