from flask import Blueprint, jsonify
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..ai import get_ai
from ..ai.schemas import QuizDraft
from ..errors import ApiError, not_found
from ..extensions import db
from ..models import Quiz, QuizAttempt, QuizQuestion
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
        .options(selectinload(Quiz.questions), selectinload(Quiz.attempts))
        .order_by(Quiz.created_at.desc(), Quiz.id.desc())
    ).all()
    return jsonify([quiz.to_summary() for quiz in quizzes])


def _validate_answers(data: dict, question_count: int) -> list[int | None]:
    answers = data.get("answers")
    valid = (
        isinstance(answers, list)
        and len(answers) == question_count
        and all(
            answer is None
            or (isinstance(answer, int) and not isinstance(answer, bool) and 0 <= answer <= 3)
            for answer in answers
        )
    )
    if not valid:
        raise ApiError(
            422,
            "validation_error",
            "Revisa los datos enviados.",
            {"answers": f"Debe ser una lista de {question_count} respuestas (0 a 3 o null)."},
        )
    return answers


@bp.post("/quizzes/<int:quiz_id>/attempts")
def create_attempt(quiz_id: int):
    """Califica las respuestas del estudiante y guarda el resultado."""
    quiz = get_quiz(quiz_id)
    answers = _validate_answers(json_body(), len(quiz.questions))
    results = [
        {
            "question_id": question.id,
            "selected_index": selected,
            "correct": selected == question.correct_index,
            "topic": question.topic,
        }
        for question, selected in zip(quiz.questions, answers, strict=True)
    ]
    attempt = QuizAttempt(
        quiz=quiz,
        score=sum(result["correct"] for result in results),
        total=len(results),
        answers=results,
    )
    db.session.add(attempt)
    db.session.commit()
    return jsonify(attempt.to_dict()), 201


@bp.get("/quizzes/<int:quiz_id>/attempts")
def list_attempts(quiz_id: int):
    quiz = get_quiz(quiz_id)
    return jsonify([attempt.to_dict() for attempt in reversed(quiz.attempts)])


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
