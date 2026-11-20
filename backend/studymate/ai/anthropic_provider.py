"""Proveedor de IA con la API de Anthropic (Claude)."""

import json
import logging
import random
from typing import Any

import anthropic
from pydantic import BaseModel, ValidationError

from . import prompts
from .base import AIError, NoteContext
from .schemas import (
    FLASHCARDS_JSON_SCHEMA,
    QUIZ_JSON_SCHEMA,
    ChatMessage,
    FlashcardDraft,
    QuestionDraft,
    QuizDraft,
)

logger = logging.getLogger(__name__)

# Si el modelo rechaza una petición por sus salvaguardas, la API la reintenta en un
# modelo de respaldo dentro de la misma llamada.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

REQUEST_TIMEOUT_SECONDS = 120.0
GENERATION_MAX_TOKENS = 16_000
CHAT_MAX_TOKENS = 8_000


def _validate_items[T: BaseModel](model: type[T], items: Any, limit: int) -> list[T]:
    """Valida cada elemento por separado y descarta los que no cumplen el esquema."""
    if not isinstance(items, list):
        return []
    valid: list[T] = []
    for item in items:
        try:
            valid.append(model.model_validate(item))
        except ValidationError:
            logger.warning("Elemento generado por la IA descartado: %r", item)
    return valid[:limit]


def _shuffle_options(question: QuestionDraft) -> QuestionDraft:
    """Mezcla las opciones para que la respuesta correcta no quede siempre en el mismo lugar."""
    correct = question.options[question.correct_index]
    options = question.options[:]
    random.shuffle(options)
    return question.model_copy(update={"options": options, "correct_index": options.index(correct)})


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, api_key: str, model: str) -> None:
        self.model = model
        self.client = anthropic.Anthropic(
            api_key=api_key, timeout=REQUEST_TIMEOUT_SECONDS, max_retries=1
        )

    def generate_flashcards(self, note: NoteContext, count: int) -> list[FlashcardDraft]:
        data = self._generate_json(
            prompts.flashcards_prompt(
                subject=note.subject, title=note.title, content=note.content, count=count
            ),
            FLASHCARDS_JSON_SCHEMA,
        )
        cards = _validate_items(FlashcardDraft, data.get("flashcards"), count)
        if not cards:
            raise AIError(502, "ai_invalid_response", "La IA no generó tarjetas válidas.")
        return cards

    def generate_quiz(self, note: NoteContext, count: int) -> QuizDraft:
        data = self._generate_json(
            prompts.quiz_prompt(
                subject=note.subject, title=note.title, content=note.content, count=count
            ),
            QUIZ_JSON_SCHEMA,
        )
        questions = _validate_items(QuestionDraft, data.get("questions"), count)
        if not questions:
            raise AIError(502, "ai_invalid_response", "La IA no generó preguntas válidas.")
        title = str(data.get("title") or "").strip()[:200] or f"Cuestionario: {note.title}"[:200]
        return QuizDraft(title=title, questions=[_shuffle_options(q) for q in questions])

    def answer(self, note: NoteContext, messages: list[ChatMessage]) -> str:
        reply = self._create(
            system=prompts.assistant_system(
                subject=note.subject, title=note.title, content=note.content
            ),
            messages=[{"role": m.role, "content": m.content} for m in messages],
            # Chat: esfuerzo bajo para responder rápido.
            effort="low",
            max_tokens=CHAT_MAX_TOKENS,
            # El sistema (con el apunte) se repite en cada turno: se guarda en caché.
            cache=True,
        )
        if not reply.strip():
            raise AIError(502, "ai_invalid_response", "La IA no devolvió una respuesta.")
        return reply.strip()

    def _generate_json(self, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        text = self._create(
            system=prompts.GENERATOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            # Generar material requiere precisión (las respuestas deben ser correctas).
            effort="medium",
            max_tokens=GENERATION_MAX_TOKENS,
            schema=schema,
        )
        try:
            data = json.loads(text)
        except json.JSONDecodeError as error:
            logger.error("Respuesta de la IA que no es JSON: %s", text[:500])
            raise AIError(
                502, "ai_invalid_response", "La IA devolvió una respuesta con formato inválido."
            ) from error
        if not isinstance(data, dict):
            raise AIError(502, "ai_invalid_response", "La IA devolvió una respuesta inesperada.")
        return data

    def _create(
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        effort: str,
        max_tokens: int,
        schema: dict[str, Any] | None = None,
        cache: bool = False,
    ) -> str:
        output_config: dict[str, Any] = {"effort": effort}
        if schema is not None:
            output_config["format"] = {"type": "json_schema", "schema": schema}
        extra: dict[str, Any] = {}
        if cache:
            extra["cache_control"] = {"type": "ephemeral"}

        try:
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,  # type: ignore[arg-type]
                output_config=output_config,  # type: ignore[arg-type]
                betas=[FALLBACK_BETA],
                fallbacks="default",
                **extra,
            )
        except anthropic.AuthenticationError as error:
            raise AIError(
                502,
                "ai_auth_error",
                "La clave de la API de IA no es válida. Revisa AI_API_KEY en backend/.env.",
            ) from error
        except anthropic.PermissionDeniedError as error:
            raise AIError(
                502, "ai_auth_error", "La clave de la API de IA no tiene permiso para este modelo."
            ) from error
        except anthropic.NotFoundError as error:
            raise AIError(
                502,
                "ai_model_not_found",
                f"El modelo «{self.model}» no está disponible. Revisa AI_MODEL en backend/.env.",
            ) from error
        except anthropic.RateLimitError as error:
            raise AIError(
                429,
                "ai_rate_limited",
                "Se alcanzó el límite de uso de la IA. Intenta de nuevo en unos minutos.",
            ) from error
        except anthropic.BadRequestError as error:
            logger.error("Petición rechazada por la API de IA: %s", error.message)
            raise AIError(
                502, "ai_bad_request", "La petición a la IA no es válida. Revisa los registros."
            ) from error
        except anthropic.APITimeoutError as error:
            raise AIError(
                504,
                "ai_timeout",
                "La IA tardó demasiado en responder. Intenta de nuevo o usa un apunte más corto.",
            ) from error
        except anthropic.APIConnectionError as error:
            raise AIError(
                502, "ai_unavailable", "No se pudo conectar con el servicio de IA."
            ) from error
        except anthropic.APIStatusError as error:
            logger.error("Error %s de la API de IA: %s", error.status_code, error.message)
            raise AIError(
                502, "ai_unavailable", "El servicio de IA no está disponible. Intenta más tarde."
            ) from error

        if response.stop_reason == "refusal":
            category = response.stop_details.category if response.stop_details else None
            logger.warning("La IA rechazó la petición (categoría: %s)", category)
            raise AIError(
                422,
                "ai_refusal",
                "La IA no pudo procesar este contenido. Prueba con otro apunte o reformula "
                "tu pregunta.",
            )
        if response.stop_reason == "max_tokens":
            raise AIError(
                502,
                "ai_incomplete",
                "La respuesta de la IA quedó incompleta. Intenta pedir menos elementos.",
            )

        # Solo cuenta el texto del último modelo que respondió (después de un respaldo).
        parts: list[str] = []
        for block in response.content:
            if block.type == "fallback":
                parts = []
            elif block.type == "text":
                parts.append(block.text)
        return "".join(parts)
