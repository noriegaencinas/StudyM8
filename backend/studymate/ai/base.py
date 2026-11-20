from dataclasses import dataclass
from typing import Protocol

from ..errors import ApiError
from .schemas import ChatMessage, FlashcardDraft, QuizDraft


class AIError(ApiError):
    """Error del servicio de IA, con un mensaje apto para mostrar al usuario."""


@dataclass(frozen=True)
class NoteContext:
    subject: str
    title: str
    content: str


class AIProvider(Protocol):
    name: str

    def generate_flashcards(self, note: NoteContext, count: int) -> list[FlashcardDraft]: ...

    def generate_quiz(self, note: NoteContext, count: int) -> QuizDraft: ...

    def answer(self, note: NoteContext, messages: list[ChatMessage]) -> str: ...
