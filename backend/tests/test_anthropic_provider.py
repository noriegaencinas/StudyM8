"""Pruebas del proveedor Anthropic con un cliente falso (no llaman a la API real)."""

import json
from types import SimpleNamespace

import anthropic
import httpx2
import pytest

from studymate.ai.anthropic_provider import FALLBACK_BETA, AnthropicProvider
from studymate.ai.base import AIError, NoteContext
from studymate.ai.schemas import ChatMessage

NOTE = NoteContext(subject="Biología", title="La célula", content="La mitocondria produce ATP.")
REQUEST = httpx2.Request("POST", "https://api.anthropic.com/v1/messages")


def text_block(text):
    return SimpleNamespace(type="text", text=text)


def response(*blocks, stop_reason="end_turn", stop_details=None):
    return SimpleNamespace(content=list(blocks), stop_reason=stop_reason, stop_details=stop_details)


class FakeMessages:
    def __init__(self, result):
        self.result = result
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


def provider_returning(result):
    provider = AnthropicProvider(api_key="sk-test", model="claude-sonnet-5-5")
    fake = FakeMessages(result)
    provider.client = SimpleNamespace(beta=SimpleNamespace(messages=fake))
    return provider, fake


def test_flashcards_use_structured_output_and_fallback():
    cards = {"flashcards": [{"front": "¿Qué produce?", "back": "ATP"}, {"front": "", "back": "x"}]}
    provider, fake = provider_returning(
        response(SimpleNamespace(type="thinking", thinking=""), text_block(json.dumps(cards)))
    )

    result = provider.generate_flashcards(NOTE, count=5)

    # La tarjeta con el frente vacío se descarta.
    assert [(c.front, c.back) for c in result] == [("¿Qué produce?", "ATP")]
    call = fake.calls[0]
    assert call["model"] == "claude-sonnet-5-5"
    assert call["output_config"]["format"]["type"] == "json_schema"
    assert call["output_config"]["effort"] == "medium"
    assert call["betas"] == [FALLBACK_BETA]
    assert call["fallbacks"] == "default"
    assert "<apuntes>\nLa mitocondria produce ATP.\n</apuntes>" in call["messages"][0]["content"]


def test_flashcards_respect_count():
    cards = {"flashcards": [{"front": f"P{i}", "back": f"R{i}"} for i in range(6)]}
    provider, _ = provider_returning(response(text_block(json.dumps(cards))))
    assert len(provider.generate_flashcards(NOTE, count=3)) == 3


def test_quiz_options_are_shuffled_keeping_correct_answer():
    question = {
        "prompt": "¿Qué produce la mitocondria?",
        "options": ["ATP", "ADN", "ARN", "Glucosa"],
        "correct_index": 0,
        "explanation": "Produce ATP.",
        "topic": "Organelos",
    }
    bad = {**question, "options": ["Solo", "dos"]}
    quiz = {"title": "Repaso", "questions": [question, bad]}
    provider, _ = provider_returning(response(text_block(json.dumps(quiz))))

    result = provider.generate_quiz(NOTE, count=5)

    assert result.title == "Repaso"
    assert len(result.questions) == 1
    generated = result.questions[0]
    assert sorted(generated.options) == sorted(question["options"])
    assert generated.options[generated.correct_index] == "ATP"


def test_text_after_fallback_block_is_used():
    cards = {"flashcards": [{"front": "A", "back": "B"}]}
    provider, _ = provider_returning(
        response(
            text_block('{"flashcards": [{"fr'),
            SimpleNamespace(type="fallback"),
            text_block(json.dumps(cards)),
        )
    )
    assert provider.generate_flashcards(NOTE, count=5)[0].front == "A"


def test_answer_uses_low_effort_and_cache():
    provider, fake = provider_returning(response(text_block("  La mitocondria produce ATP.  ")))
    reply = provider.answer(NOTE, [ChatMessage(role="user", content="¿Qué produce?")])

    assert reply == "La mitocondria produce ATP."
    call = fake.calls[0]
    assert call["output_config"] == {"effort": "low"}
    assert call["cache_control"] == {"type": "ephemeral"}
    assert "La mitocondria produce ATP." in call["system"]
    assert call["messages"] == [{"role": "user", "content": "¿Qué produce?"}]


def test_refusal_is_reported():
    details = SimpleNamespace(category="cyber", explanation="")
    provider, _ = provider_returning(response(stop_reason="refusal", stop_details=details))
    with pytest.raises(AIError) as error:
        provider.answer(NOTE, [ChatMessage(role="user", content="Hola")])
    assert (error.value.status, error.value.code) == (422, "ai_refusal")


def test_truncated_response_is_reported():
    provider, _ = provider_returning(response(text_block('{"flash'), stop_reason="max_tokens"))
    with pytest.raises(AIError) as error:
        provider.generate_flashcards(NOTE, count=5)
    assert error.value.code == "ai_incomplete"


def test_invalid_json_is_reported():
    provider, _ = provider_returning(response(text_block("no es json")))
    with pytest.raises(AIError) as error:
        provider.generate_quiz(NOTE, count=5)
    assert error.value.code == "ai_invalid_response"


@pytest.mark.parametrize(
    ("exception", "status", "code"),
    [
        (
            anthropic.AuthenticationError(
                "bad key", response=httpx2.Response(401, request=REQUEST), body=None
            ),
            502,
            "ai_auth_error",
        ),
        (
            anthropic.RateLimitError(
                "limit", response=httpx2.Response(429, request=REQUEST), body=None
            ),
            429,
            "ai_rate_limited",
        ),
        (
            anthropic.NotFoundError(
                "model", response=httpx2.Response(404, request=REQUEST), body=None
            ),
            502,
            "ai_model_not_found",
        ),
        (
            anthropic.InternalServerError(
                "boom", response=httpx2.Response(500, request=REQUEST), body=None
            ),
            502,
            "ai_unavailable",
        ),
        (anthropic.APITimeoutError(request=REQUEST), 504, "ai_timeout"),
        (anthropic.APIConnectionError(request=REQUEST), 502, "ai_unavailable"),
    ],
)
def test_sdk_errors_are_mapped(exception, status, code):
    provider, _ = provider_returning(exception)
    with pytest.raises(AIError) as error:
        provider.answer(NOTE, [ChatMessage(role="user", content="Hola")])
    assert (error.value.status, error.value.code) == (status, code)
