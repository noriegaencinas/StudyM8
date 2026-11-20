"""Estructuras del material generado por la IA.

Los modelos Pydantic validan tanto la respuesta de la IA como lo que la app
envía al guardar (el usuario puede editar el borrador antes de guardarlo).
"""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

OPTIONS_PER_QUESTION = 4

ShortText = Annotated[str, Field(min_length=1, max_length=500)]


class Draft(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")


class FlashcardDraft(Draft):
    front: ShortText
    back: Annotated[str, Field(min_length=1, max_length=2000)]


class QuestionDraft(Draft):
    prompt: Annotated[str, Field(min_length=1, max_length=1000)]
    options: Annotated[
        list[Annotated[str, Field(min_length=1, max_length=300)]],
        Field(min_length=OPTIONS_PER_QUESTION, max_length=OPTIONS_PER_QUESTION),
    ]
    correct_index: Annotated[int, Field(ge=0, lt=OPTIONS_PER_QUESTION)]
    explanation: Annotated[str, Field(max_length=1000)] = ""
    topic: Annotated[str, Field(min_length=1, max_length=100)]


class QuizDraft(Draft):
    title: Annotated[str, Field(min_length=1, max_length=200)]
    questions: Annotated[list[QuestionDraft], Field(min_length=1, max_length=20)]


class FlashcardBatch(Draft):
    flashcards: Annotated[list[FlashcardDraft], Field(min_length=1, max_length=50)]


class ChatMessage(Draft):
    role: Literal["user", "assistant"]
    content: Annotated[str, Field(min_length=1, max_length=4000)]


class ChatRequest(Draft):
    messages: Annotated[list[ChatMessage], Field(min_length=1, max_length=30)]


# Esquemas JSON para las salidas estructuradas de la API de Claude. Se mantienen
# simples (sin límites numéricos ni de longitud); los límites se validan después
# con los modelos Pydantic de arriba.
FLASHCARDS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": {"type": "string"},
                    "back": {"type": "string"},
                },
                "required": ["front", "back"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["flashcards"],
    "additionalProperties": False,
}

QUIZ_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string"},
                    "options": {"type": "array", "items": {"type": "string"}},
                    "correct_index": {"type": "integer", "enum": [0, 1, 2, 3]},
                    "explanation": {"type": "string"},
                    "topic": {"type": "string"},
                },
                "required": ["prompt", "options", "correct_index", "explanation", "topic"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["title", "questions"],
    "additionalProperties": False,
}
