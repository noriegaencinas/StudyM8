from flask import Blueprint, jsonify

from ..ai import get_ai
from ..ai.schemas import ChatRequest
from ..errors import ApiError
from ..validation import json_body, parse_model
from .notes import ai_context, get_note

bp = Blueprint("assistant", __name__, url_prefix="/api")


@bp.post("/notes/<int:note_id>/assistant")
def ask_assistant(note_id: int):
    """Responde una pregunta sobre el apunte.

    La conversación la guarda la app y la envía completa en cada petición.
    """
    note = get_note(note_id)
    chat = parse_model(ChatRequest, json_body())
    if chat.messages[0].role != "user" or chat.messages[-1].role != "user":
        raise ApiError(
            422,
            "validation_error",
            "La conversación debe empezar y terminar con un mensaje del estudiante.",
        )

    reply = get_ai().answer(ai_context(note), chat.messages)
    return jsonify({"reply": reply})
