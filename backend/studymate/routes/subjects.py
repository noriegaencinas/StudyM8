import unicodedata

from flask import Blueprint, jsonify
from sqlalchemy import func, select

from ..errors import not_found
from ..extensions import db
from ..models import DEFAULT_SUBJECT_COLOR, Note, Subject
from ..validation import Validator, json_body
from .notes import validate_note

bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")

COLOR_PATTERN = r"#[0-9A-Fa-f]{6}"


def sort_key(text: str) -> str:
    """Orden alfabético que ignora acentos y mayúsculas ("Álgebra" antes que "química")."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).casefold()


def get_subject(subject_id: int) -> Subject:
    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise not_found("La materia")
    return subject


def count_notes(subject_id: int) -> int:
    query = select(func.count(Note.id)).where(Note.subject_id == subject_id)
    return db.session.scalar(query) or 0


def validate_subject(*, partial: bool) -> dict:
    validator = Validator(json_body(), partial=partial)
    validator.text("name", max_length=100, required=True)
    validator.text("description", max_length=500)
    validator.text(
        "color",
        max_length=7,
        default=DEFAULT_SUBJECT_COLOR,
        pattern=COLOR_PATTERN,
        pattern_message="Debe ser un color hexadecimal, por ejemplo #2563EB.",
    )
    values = validator.validate()
    if "color" in values and not values["color"]:
        values["color"] = DEFAULT_SUBJECT_COLOR
    return values


@bp.get("")
def list_subjects():
    counts = dict(
        db.session.execute(
            select(Note.subject_id, func.count(Note.id)).group_by(Note.subject_id)
        ).all()
    )
    subjects = sorted(db.session.scalars(select(Subject)).all(), key=lambda s: sort_key(s.name))
    return jsonify([s.to_dict(note_count=counts.get(s.id, 0)) for s in subjects])


@bp.post("")
def create_subject():
    subject = Subject(**validate_subject(partial=False))
    db.session.add(subject)
    db.session.commit()
    return jsonify(subject.to_dict(note_count=0)), 201


@bp.get("/<int:subject_id>")
def read_subject(subject_id: int):
    subject = get_subject(subject_id)
    return jsonify(subject.to_dict(note_count=count_notes(subject_id)))


@bp.patch("/<int:subject_id>")
def update_subject(subject_id: int):
    subject = get_subject(subject_id)
    for field, value in validate_subject(partial=True).items():
        setattr(subject, field, value)
    db.session.commit()
    return jsonify(subject.to_dict(note_count=count_notes(subject_id)))


@bp.delete("/<int:subject_id>")
def delete_subject(subject_id: int):
    db.session.delete(get_subject(subject_id))
    db.session.commit()
    return "", 204


@bp.get("/<int:subject_id>/notes")
def list_notes(subject_id: int):
    get_subject(subject_id)
    notes = db.session.scalars(
        select(Note).where(Note.subject_id == subject_id).order_by(Note.updated_at.desc())
    ).all()
    return jsonify([note.to_summary() for note in notes])


@bp.post("/<int:subject_id>/notes")
def create_note(subject_id: int):
    subject = get_subject(subject_id)
    note = Note(subject=subject, **validate_note(partial=False))
    db.session.add(note)
    db.session.commit()
    return jsonify(note.to_dict()), 201
