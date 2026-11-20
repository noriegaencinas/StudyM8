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
  attempt_count: number;
  best_percent: number | null;
  last_percent: number | null;
};

export type QuizAttempt = {
  id: number;
  quiz_id: number;
  score: number;
  total: number;
  percent: number;
  created_at: string;
};

export type Progress = {
  totals: {
    subjects: number;
    notes: number;
    quizzes: number;
    attempts: number;
    mastery_percent: number | null;
    flashcards: number;
    flashcards_reviewed: number;
    flashcard_recall_percent: number | null;
  };
  subjects: (SubjectRef & {
    note_count: number;
    attempt_count: number;
    mastery_percent: number | null;
    last_attempt_at: string | null;
  })[];
  weak_topics: {
    topic: string;
    subject: SubjectRef;
    note_id: number;
    correct: number;
    total: number;
    percent: number;
  }[];
  recent_attempts: (QuizAttempt & {
    quiz_title: string;
    note_id: number;
    note_title: string;
    subject: SubjectRef;
  })[];
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
