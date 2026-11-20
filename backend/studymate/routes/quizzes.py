from flask import Blueprint, jsonify
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..ai import get_ai
from ..ai.schemas import QuizDraft
from ..errors import not_found
from ..extensions import db
from ..models import Quiz, QuizQuestion
from ..validation import Validator, json_body, parse_model
from .notes import ai_context, get_note

bp = Blueprint("quizzes", __name__, url_prefix="/api")

DEFAULT_GENERATED_QUESTIONS = 5
MAX_GENERATED_QUESTIONS = 15


def get_quiz(quiz_id: int) -> Quiz:
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        raise not_found("El cuestionario")
    return quiz


@bp.post("/notes/<int:note_id>/quizzes/generate")
def generate_quiz(note_id: int):
    """Genera un borrador de cuestionario con IA. No se guarda hasta que la app lo confirma."""
    note = get_note(note_id)
    validator = Validator(json_body(optional=True))
    validator.integer(
        "count", minimum=1, maximum=MAX_GENERATED_QUESTIONS, default=DEFAULT_GENERATED_QUESTIONS
    )
    count = validator.validate()["count"]

    draft = get_ai().generate_quiz(ai_context(note), count)
    return jsonify(draft.model_dump())


@bp.get("/notes/<int:note_id>/quizzes")
def list_quizzes(note_id: int):
    get_note(note_id)
    quizzes = db.session.scalars(
        select(Quiz)
        .where(Quiz.note_id == note_id)
        .options(selectinload(Quiz.questions))
        .order_by(Quiz.created_at.desc(), Quiz.id.desc())
    ).all()
    return jsonify([quiz.to_summary() for quiz in quizzes])


@bp.post("/notes/<int:note_id>/quizzes")
def create_quiz(note_id: int):
    note = get_note(note_id)
    draft = parse_model(QuizDraft, json_body())
    quiz = Quiz(
        note=note,
        title=draft.title,
        questions=[
            QuizQuestion(
                position=position,
                prompt=question.prompt,
                options=question.options,
                correct_index=question.correct_index,
                explanation=question.explanation,
                topic=question.topic,
            )
            for position, question in enumerate(draft.questions)
        ],
    )
    db.session.add(quiz)
    db.session.commit()
    return jsonify(quiz.to_dict()), 201


@bp.get("/quizzes/<int:quiz_id>")
def read_quiz(quiz_id: int):
    return jsonify(get_quiz(quiz_id).to_dict())


@bp.delete("/quizzes/<int:quiz_id>")
def delete_quiz(quiz_id: int):
    db.session.delete(get_quiz(quiz_id))
    db.session.commit()
    return "", 204
