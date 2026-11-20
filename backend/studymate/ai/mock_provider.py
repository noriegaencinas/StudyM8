"""Proveedor simulado: genera material sin llamar a ninguna API.

Se usa en las pruebas y cuando AI_PROVIDER=mock, para desarrollar sin gastar
créditos. El contenido es mecánico (sale de las oraciones del apunte).
"""

import re

from .base import NoteContext
from .schemas import ChatMessage, FlashcardDraft, QuestionDraft, QuizDraft

DISTRACTORS = [
    "Ninguna de las otras opciones aparece en el apunte.",
    "Lo contrario de lo que dice el apunte.",
    "Un dato que el apunte no menciona.",
]


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [part.strip() for part in parts if len(part.strip()) >= 15]


def _preview(sentence: str, words: int = 6) -> str:
    tokens = sentence.split()
    head = " ".join(tokens[:words])
    return head + ("…" if len(tokens) > words else "")


class MockProvider:
    name = "mock"

    def generate_flashcards(self, note: NoteContext, count: int) -> list[FlashcardDraft]:
        sentences = _sentences(note.content) or [note.content.strip()]
        return [
            FlashcardDraft(front=f"Completa la idea: «{_preview(sentence)}»", back=sentence[:2000])
            for sentence in sentences[:count]
        ]

    def generate_quiz(self, note: NoteContext, count: int) -> QuizDraft:
        sentences = _sentences(note.content) or [note.content.strip()]
        questions = []
        for index, sentence in enumerate(sentences[:count]):
            correct_index = index % 4
            options = DISTRACTORS[:]
            options.insert(correct_index, sentence[:300])
            questions.append(
                QuestionDraft(
                    prompt=f"¿Qué afirma el apunte sobre «{_preview(sentence, 4)}»?",
                    options=options,
                    correct_index=correct_index,
                    explanation="Es la oración tal como aparece en el apunte.",
                    topic=note.title[:100],
                )
            )
        return QuizDraft(title=f"Repaso: {note.title}"[:200], questions=questions)

    def answer(self, note: NoteContext, messages: list[ChatMessage]) -> str:
        question = messages[-1].content
        words = len(note.content.split())
        return (
            f"(Modo simulado) Recibí tu pregunta: «{question}». Tu apunte «{note.title}» "
            f"tiene {words} palabras. Configura AI_PROVIDER=anthropic y AI_API_KEY en "
            "backend/.env para recibir explicaciones reales."
        )
