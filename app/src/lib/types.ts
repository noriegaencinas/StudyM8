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
