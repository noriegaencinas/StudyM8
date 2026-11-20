"""Servicio de IA: elige el proveedor según la configuración."""

from flask import current_app

from .base import AIError, AIProvider, NoteContext

PLACEHOLDER_KEYS = {"", "tu-clave-aqui"}

__all__ = ["AIError", "AIProvider", "NoteContext", "ai_status", "get_ai"]


def ai_status() -> dict:
    config = current_app.config
    provider = config["AI_PROVIDER"]
    configured = provider == "mock" or (
        provider == "anthropic" and config["AI_API_KEY"] not in PLACEHOLDER_KEYS
    )
    status = {"provider": provider, "configured": configured}
    if provider == "anthropic":
        status["model"] = config["AI_MODEL"]
    return status


def get_ai() -> AIProvider:
    """Devuelve el proveedor configurado (se crea una sola vez por aplicación)."""
    cached = current_app.extensions.get("studymate_ai")
    if cached is not None:
        return cached

    config = current_app.config
    provider_name = config["AI_PROVIDER"]
    provider: AIProvider
    if provider_name == "mock":
        from .mock_provider import MockProvider

        provider = MockProvider()
    elif provider_name == "anthropic":
        if config["AI_API_KEY"] in PLACEHOLDER_KEYS:
            raise AIError(
                503,
                "ai_not_configured",
                "La IA no está configurada. Agrega AI_API_KEY en backend/.env y reinicia "
                "el servidor.",
            )
        from .anthropic_provider import AnthropicProvider

        provider = AnthropicProvider(config["AI_API_KEY"], config["AI_MODEL"])
    else:
        raise AIError(
            503,
            "ai_not_configured",
            f"Proveedor de IA desconocido: «{provider_name}». Usa anthropic o mock.",
        )

    current_app.extensions["studymate_ai"] = provider
    return provider
