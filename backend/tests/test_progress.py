import pytest


def make_question(topic, correct_index=0):
    return {
        "prompt": f"Pregunta sobre {topic}",
        "options": ["A", "B", "C", "D"],
        "correct_index": correct_index,
        "explanation": "",
        "topic": topic,
    }


@pytest.fixture
def quiz(client, note):
    body = {
        "title": "Repaso de la célula",
        "questions": [
            make_question("Organelos"),
            make_question("Organelos"),
            make_question("Membrana"),
            make_question("ADN"),
        ],
    }
    return client.post(f"/api/notes/{note['id']}/quizzes", json=body).get_json()


def attempt(client, quiz, answers):
    return client.post(f"/api/quizzes/{quiz['id']}/attempts", json={"answers": answers})


def test_attempt_is_graded(client, quiz):
    response = attempt(client, quiz, [0, 1, 0, None])
    assert response.status_code == 201
    body = response.get_json()
    assert (body["score"], body["total"], body["percent"]) == (2, 4, 50)
    assert [a["correct"] for a in body["answers"]] == [True, False, True, False]
    assert body["answers"][3]["selected_index"] is None
    assert body["answers"][0]["topic"] == "Organelos"


def test_attempt_validation(client, quiz):
    for answers in ([0, 0, 0], [0, 0, 0, 4], [0, 0, 0, "1"], [0, 0, 0, True], "0000"):
        response = attempt(client, quiz, answers)
        assert response.status_code == 422, answers
        assert "answers" in response.get_json()["error"]["fields"]


def test_quiz_summary_includes_scores(client, note, quiz):
    summary = client.get(f"/api/notes/{note['id']}/quizzes").get_json()[0]
    assert (summary["attempt_count"], summary["best_percent"], summary["last_percent"]) == (
        0,
        None,
        None,
    )

    attempt(client, quiz, [0, 0, 0, 0])  # 100 %
    attempt(client, quiz, [1, 0, 1, 0])  # 50 %

    summary = client.get(f"/api/notes/{note['id']}/quizzes").get_json()[0]
    assert (summary["attempt_count"], summary["best_percent"], summary["last_percent"]) == (
        2,
        100,
        50,
    )
    history = client.get(f"/api/quizzes/{quiz['id']}/attempts").get_json()
    assert [a["percent"] for a in history] == [50, 100]


def test_progress_empty(client):
    body = client.get("/api/progress").get_json()
    assert body["totals"]["attempts"] == 0
    assert body["totals"]["mastery_percent"] is None
    assert body["totals"]["flashcard_recall_percent"] is None
    assert body["subjects"] == []
    assert body["weak_topics"] == []
    assert body["recent_attempts"] == []


def test_progress_uses_latest_attempt_per_quiz(client, subject, note, quiz):
    # Primer intento: falla todo lo de Organelos y Membrana.
    attempt(client, quiz, [1, 1, 1, 0])  # 25 %
    # Segundo intento: mejora Organelos, sigue fallando Membrana.
    attempt(client, quiz, [0, 0, 1, 0])  # 75 %

    body = client.get("/api/progress").get_json()
    totals = body["totals"]
    assert totals["attempts"] == 2
    assert totals["quizzes"] == 1
    assert totals["mastery_percent"] == 75

    [row] = body["subjects"]
    assert row["name"] == subject["name"]
    assert (row["attempt_count"], row["mastery_percent"], row["note_count"]) == (2, 75, 1)

    # Solo cuenta el último intento: Organelos ya no es un tema débil.
    assert [(t["topic"], t["percent"], t["total"]) for t in body["weak_topics"]] == [
        ("Membrana", 0, 1)
    ]
    assert body["weak_topics"][0]["note_id"] == note["id"]
    assert body["weak_topics"][0]["subject"]["id"] == subject["id"]

    recent = body["recent_attempts"]
    assert [a["percent"] for a in recent] == [75, 25]
    assert recent[0]["quiz_title"] == "Repaso de la célula"
    assert recent[0]["note_title"] == note["title"]


def test_progress_topics_are_grouped_case_insensitively(client, note):
    body = {
        "title": "Mixto",
        "questions": [make_question("Mitosis"), make_question("mitosis ")],
    }
    quiz = client.post(f"/api/notes/{note['id']}/quizzes", json=body).get_json()
    attempt(client, quiz, [0, 1])

    [topic] = client.get("/api/progress").get_json()["weak_topics"]
    assert (topic["topic"], topic["correct"], topic["total"], topic["percent"]) == (
        "Mitosis",
        1,
        2,
        50,
    )


def test_progress_flashcard_stats(client, note):
    cards = client.post(
        f"/api/notes/{note['id']}/flashcards",
        json={"flashcards": [{"front": "A", "back": "B"}, {"front": "C", "back": "D"}]},
    ).get_json()
    client.post(f"/api/flashcards/{cards[0]['id']}/review", json={"known": True})
    client.post(f"/api/flashcards/{cards[0]['id']}/review", json={"known": True})
    client.post(f"/api/flashcards/{cards[0]['id']}/review", json={"known": False})

    totals = client.get("/api/progress").get_json()["totals"]
    assert totals["flashcards"] == 2
    assert totals["flashcards_reviewed"] == 1
    assert totals["flashcard_recall_percent"] == 67


def test_subjects_without_attempts_go_last(client, quiz):
    client.post("/api/subjects", json={"name": "Álgebra"})
    attempt(client, quiz, [0, 0, 0, 0])

    rows = client.get("/api/progress").get_json()["subjects"]
    assert [r["name"] for r in rows] == ["Biología", "Álgebra"]
    assert rows[1]["mastery_percent"] is None
    assert rows[1]["last_attempt_at"] is None
