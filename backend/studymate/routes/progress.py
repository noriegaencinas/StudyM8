"""Resumen del progreso del estudiante."""

from collections import defaultdict
from statistics import mean
from typing import Any

from flask import Blueprint, jsonify
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Flashcard, Note, Quiz, QuizAttempt, Subject, isoformat

bp = Blueprint("progress", __name__, url_prefix="/api")

# Un tema se marca "a reforzar" si el porcentaje de aciertos es menor a este valor.
WEAK_TOPIC_THRESHOLD = 70
MAX_WEAK_TOPICS = 8
MAX_RECENT_ATTEMPTS = 10


def _mean_percent(attempts: list[QuizAttempt]) -> int | None:
    return round(mean(a.percent for a in attempts)) if attempts else None


@bp.get("/progress")
def progress():
    """Progreso general y por materia.

    El dominio se calcula con el último intento de cada cuestionario, para que
    volver a resolver un cuestionario reemplace el resultado anterior. Los
    temas a reforzar también usan solo esos últimos intentos.
    """
    subjects = db.session.scalars(select(Subject)).all()
    quizzes = db.session.scalars(
        select(Quiz).options(
            selectinload(Quiz.attempts), selectinload(Quiz.note).selectinload(Note.subject)
        )
    ).all()
    note_counts = dict(
        db.session.execute(
            select(Note.subject_id, func.count(Note.id)).group_by(Note.subject_id)
        ).all()
    )

    latest_by_subject: dict[int, list[QuizAttempt]] = defaultdict(list)
    attempt_count_by_subject: dict[int, int] = defaultdict(int)
    last_attempt_by_subject: dict[int, QuizAttempt] = {}
    recent: list[tuple[QuizAttempt, Quiz]] = []
    topics: dict[tuple[int, str], dict[str, Any]] = {}

    for quiz in quizzes:
        subject_id = quiz.note.subject_id
        for attempt in quiz.attempts:
            recent.append((attempt, quiz))
            attempt_count_by_subject[subject_id] += 1
            previous = last_attempt_by_subject.get(subject_id)
            if previous is None or attempt.created_at > previous.created_at:
                last_attempt_by_subject[subject_id] = attempt

        latest = quiz.latest_attempt
        if latest is None:
            continue
        latest_by_subject[subject_id].append(latest)
        for answer in latest.answers:
            name = str(answer.get("topic") or "").strip() or quiz.title
            entry = topics.setdefault(
                (subject_id, name.casefold()),
                {"topic": name, "subject": quiz.note.subject.to_ref(), "correct": 0, "total": 0},
            )
            entry["correct"] += int(bool(answer.get("correct")))
            entry["total"] += 1
            entry["note_id"] = quiz.note_id

    weak_topics = []
    for entry in topics.values():
        entry["percent"] = round(entry["correct"] * 100 / entry["total"])
        if entry["percent"] < WEAK_TOPIC_THRESHOLD:
            weak_topics.append(entry)
    weak_topics.sort(key=lambda e: (e["percent"], -e["total"], e["topic"].casefold()))

    subject_rows = []
    for subject in subjects:
        last = last_attempt_by_subject.get(subject.id)
        subject_rows.append(
            {
                **subject.to_ref(),
                "note_count": note_counts.get(subject.id, 0),
                "attempt_count": attempt_count_by_subject[subject.id],
                "mastery_percent": _mean_percent(latest_by_subject[subject.id]),
                "last_attempt_at": isoformat(last.created_at) if last else None,
            }
        )
    # Primero las materias con resultados, de menor a mayor dominio; luego el resto.
    subject_rows.sort(
        key=lambda s: (s["mastery_percent"] is None, s["mastery_percent"] or 0, s["name"])
    )

    recent.sort(key=lambda pair: (pair[0].created_at, pair[0].id), reverse=True)
    all_latest = [a for attempts in latest_by_subject.values() for a in attempts]

    known, unknown, reviewed, card_total = db.session.execute(
        select(
            func.coalesce(func.sum(Flashcard.known_count), 0),
            func.coalesce(func.sum(Flashcard.unknown_count), 0),
            func.count(Flashcard.last_reviewed_at),
            func.count(Flashcard.id),
        )
    ).one()

    return jsonify(
        {
            "totals": {
                "subjects": len(subjects),
                "notes": sum(note_counts.values()),
                "quizzes": len(quizzes),
                "attempts": len(recent),
                "mastery_percent": _mean_percent(all_latest),
                "flashcards": card_total,
                "flashcards_reviewed": reviewed,
                "flashcard_recall_percent": (
                    round(known * 100 / (known + unknown)) if known + unknown else None
                ),
            },
            "subjects": subject_rows,
            "weak_topics": weak_topics[:MAX_WEAK_TOPICS],
            "recent_attempts": [
                {
                    "id": attempt.id,
                    "quiz_id": quiz.id,
                    "quiz_title": quiz.title,
                    "note_id": quiz.note_id,
                    "note_title": quiz.note.title,
                    "subject": quiz.note.subject.to_ref(),
                    "score": attempt.score,
                    "total": attempt.total,
                    "percent": attempt.percent,
                    "created_at": isoformat(attempt.created_at),
                }
                for attempt, quiz in recent[:MAX_RECENT_ATTEMPTS]
            ],
        }
    )
