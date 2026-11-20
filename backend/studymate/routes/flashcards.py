from flask import Blueprint, jsonify
from sqlalchemy import select

from ..ai import get_ai
from ..ai.schemas import FlashcardBatch
from ..errors import not_found
from ..extensions import db
from ..models import Flashcard, utcnow
from ..validation import Validator, json_body, parse_model
from .notes import ai_context, get_note

bp = Blueprint("flashcards", __name__, url_prefix="/api")

DEFAULT_GENERATED_FLASHCARDS = 8
MAX_GENERATED_FLASHCARDS = 20


def get_flashcard(flashcard_id: int) -> Flashcard:
    flashcard = db.session.get(Flashcard, flashcard_id)
    if flashcard is None:
        raise not_found("La tarjeta")
    return flashcard


@bp.post("/notes/<int:note_id>/flashcards/generate")
def generate_flashcards(note_id: int):
    """Genera un borrador de tarjetas con IA. No se guarda: la app decide cuáles conservar."""
    note = get_note(note_id)
    validator = Validator(json_body(optional=True))
    validator.integer(
        "count", minimum=1, maximum=MAX_GENERATED_FLASHCARDS, default=DEFAULT_GENERATED_FLASHCARDS
    )
    count = validator.validate()["count"]

    drafts = get_ai().generate_flashcards(ai_context(note), count)
    return jsonify({"flashcards": [draft.model_dump() for draft in drafts]})


@bp.get("/notes/<int:note_id>/flashcards")
def list_flashcards(note_id: int):
    get_note(note_id)
    flashcards = db.session.scalars(
        select(Flashcard).where(Flashcard.note_id == note_id).order_by(Flashcard.id)
    ).all()
    return jsonify([flashcard.to_dict() for flashcard in flashcards])


@bp.post("/notes/<int:note_id>/flashcards")
def create_flashcards(note_id: int):
    note = get_note(note_id)
    batch = parse_model(FlashcardBatch, json_body())
    flashcards = [Flashcard(note=note, front=d.front, back=d.back) for d in batch.flashcards]
    db.session.add_all(flashcards)
    db.session.commit()
    return jsonify([flashcard.to_dict() for flashcard in flashcards]), 201


@bp.patch("/flashcards/<int:flashcard_id>")
def update_flashcard(flashcard_id: int):
    flashcard = get_flashcard(flashcard_id)
    validator = Validator(json_body(), partial=True)
    validator.text("front", max_length=500, required=True)
    validator.text("back", max_length=2000, required=True)
    for field, value in validator.validate().items():
        setattr(flashcard, field, value)
    db.session.commit()
    return jsonify(flashcard.to_dict())


@bp.delete("/flashcards/<int:flashcard_id>")
def delete_flashcard(flashcard_id: int):
    db.session.delete(get_flashcard(flashcard_id))
    db.session.commit()
    return "", 204


@bp.post("/flashcards/<int:flashcard_id>/review")
def review_flashcard(flashcard_id: int):
    """Registra si el estudiante se sabía la tarjeta al repasarla."""
    flashcard = get_flashcard(flashcard_id)
    validator = Validator(json_body())
    validator.boolean("known")
    if validator.validate()["known"]:
        flashcard.known_count += 1
    else:
        flashcard.unknown_count += 1
    flashcard.last_reviewed_at = utcnow()
    db.session.commit()
    return jsonify(flashcard.to_dict())
