"""Modelos de la base de datos."""

import re
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db

DEFAULT_SUBJECT_COLOR = "#2563EB"
EXCERPT_LENGTH = 160


def utcnow() -> datetime:
    """Fecha actual en UTC sin zona horaria (SQLite no guarda la zona)."""
    return datetime.now(UTC).replace(tzinfo=None)


def isoformat(value: datetime) -> str:
    return value.replace(tzinfo=UTC).isoformat().replace("+00:00", "Z")


def excerpt(text: str, length: int = EXCERPT_LENGTH) -> str:
    collapsed = re.sub(r"\s+", " ", text).strip()
    if len(collapsed) <= length:
        return collapsed
    return collapsed[: length - 1].rstrip() + "…"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    def timestamps(self) -> dict[str, str]:
        return {"created_at": isoformat(self.created_at), "updated_at": isoformat(self.updated_at)}


class Subject(TimestampMixin, db.Model):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(7), default=DEFAULT_SUBJECT_COLOR)

    notes: Mapped[list["Note"]] = relationship(
        back_populates="subject", cascade="all, delete-orphan", passive_deletes=True
    )

    def to_dict(self, *, note_count: int) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "note_count": note_count,
            **self.timestamps(),
        }

    def to_ref(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "color": self.color}


class Note(TimestampMixin, db.Model):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text, default="")

    subject: Mapped[Subject] = relationship(back_populates="notes")
    flashcards: Mapped[list["Flashcard"]] = relationship(
        back_populates="note", cascade="all, delete-orphan", passive_deletes=True
    )
    quizzes: Mapped[list["Quiz"]] = relationship(
        back_populates="note", cascade="all, delete-orphan", passive_deletes=True
    )

    def to_summary(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "subject_id": self.subject_id,
            "title": self.title,
            "excerpt": excerpt(self.content),
            **self.timestamps(),
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            **self.to_summary(),
            "content": self.content,
            "subject": self.subject.to_ref(),
        }


class Flashcard(TimestampMixin, db.Model):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    known_count: Mapped[int] = mapped_column(Integer, default=0)
    unknown_count: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)

    note: Mapped[Note] = relationship(back_populates="flashcards")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "note_id": self.note_id,
            "front": self.front,
            "back": self.back,
            "known_count": self.known_count,
            "unknown_count": self.unknown_count,
            "last_reviewed_at": isoformat(self.last_reviewed_at) if self.last_reviewed_at else None,
            **self.timestamps(),
        }


class Quiz(TimestampMixin, db.Model):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True)
    note_id: Mapped[int] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))

    note: Mapped[Note] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="QuizQuestion.position",
    )

    def to_summary(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "note_id": self.note_id,
            "title": self.title,
            "question_count": len(self.questions),
            **self.timestamps(),
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            **self.to_summary(),
            "note": {"id": self.note.id, "title": self.note.title},
            "subject": self.note.subject.to_ref(),
            "questions": [question.to_dict() for question in self.questions],
        }


class QuizQuestion(db.Model):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    prompt: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str]] = mapped_column(JSON)
    correct_index: Mapped[int] = mapped_column(Integer)
    explanation: Mapped[str] = mapped_column(Text, default="")
    topic: Mapped[str] = mapped_column(String(100))

    quiz: Mapped[Quiz] = relationship(back_populates="questions")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "prompt": self.prompt,
            "options": self.options,
            "correct_index": self.correct_index,
            "explanation": self.explanation,
            "topic": self.topic,
        }
