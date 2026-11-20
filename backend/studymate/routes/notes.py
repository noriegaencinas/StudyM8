from flask import Blueprint, jsonify

from ..errors import not_found
from ..extensions import db
from ..models import Note
from ..validation import Validator, json_body

bp = Blueprint("notes", __name__, url_prefix="/api/notes")

MAX_NOTE_CONTENT = 50_000


def get_note(note_id: int) -> Note:
    note = db.session.get(Note, note_id)
    if note is None:
        raise not_found("El apunte")
    return note


def validate_note(*, partial: bool) -> dict:
    validator = Validator(json_body(), partial=partial)
    validator.text("title", max_length=200, required=True)
    validator.text("content", max_length=MAX_NOTE_CONTENT)
    return validator.validate()


@bp.get("/<int:note_id>")
def read_note(note_id: int):
    return jsonify(get_note(note_id).to_dict())


@bp.patch("/<int:note_id>")
def update_note(note_id: int):
    note = get_note(note_id)
    for field, value in validate_note(partial=True).items():
        setattr(note, field, value)
    db.session.commit()
    return jsonify(note.to_dict())


@bp.delete("/<int:note_id>")
def delete_note(note_id: int):
    db.session.delete(get_note(note_id))
    db.session.commit()
    return "", 204
