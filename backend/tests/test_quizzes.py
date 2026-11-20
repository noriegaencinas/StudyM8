QUESTION = {
    "prompt": "¿Qué produce la mitocondria?",
    "options": ["ATP", "ADN", "Glucosa", "Oxígeno"],
    "correct_index": 0,
    "explanation": "La mitocondria produce energía en forma de ATP.",
    "topic": "Organelos",
}


def save_quiz(client, note, **overrides):
    body = {"title": "Repaso", "questions": [QUESTION], **overrides}
    return client.post(f"/api/notes/{note['id']}/quizzes", json=body)


def test_generate_quiz_with_mock(client, note):
    response = client.post(f"/api/notes/{note['id']}/quizzes/generate", json={"count": 2})
    assert response.status_code == 200
    draft = response.get_json()
    assert draft["title"] == "Repaso: La célula"
    assert len(draft["questions"]) == 2
    first = draft["questions"][0]
    assert len(first["options"]) == 4
    assert first["options"][first["correct_index"]] == "La célula es la unidad básica de la vida."

    assert client.get(f"/api/notes/{note['id']}/quizzes").get_json() == []


def test_save_read_list_and_delete_quiz(client, note, subject):
    response = save_quiz(client, note)
    assert response.status_code == 201
    quiz = response.get_json()
    assert quiz["question_count"] == 1
    assert quiz["subject"]["name"] == subject["name"]
    assert quiz["note"] == {"id": note["id"], "title": note["title"]}
    assert quiz["questions"][0]["options"] == QUESTION["options"]

    second = save_quiz(client, note, title="Segundo").get_json()
    summaries = client.get(f"/api/notes/{note['id']}/quizzes").get_json()
    assert [s["title"] for s in summaries] == ["Segundo", "Repaso"]
    assert "questions" not in summaries[0]

    assert client.get(f"/api/quizzes/{quiz['id']}").get_json()["title"] == "Repaso"
    assert client.delete(f"/api/quizzes/{second['id']}").status_code == 204
    assert client.get(f"/api/quizzes/{second['id']}").status_code == 404


def test_save_quiz_validation(client, note):
    response = save_quiz(client, note, questions=[{**QUESTION, "options": ["A", "B", "C"]}])
    assert response.status_code == 422
    assert "questions.0.options" in response.get_json()["error"]["fields"]

    response = save_quiz(client, note, questions=[{**QUESTION, "correct_index": 4}])
    assert response.status_code == 422

    response = save_quiz(client, note, title="  ")
    assert response.status_code == 422
    assert response.get_json()["error"]["fields"]["title"] == "No puede estar vacío."


def test_deleting_note_deletes_its_quizzes(client, note):
    quiz = save_quiz(client, note).get_json()
    client.delete(f"/api/notes/{note['id']}")
    assert client.get(f"/api/quizzes/{quiz['id']}").status_code == 404


def test_assistant_with_mock(client, note):
    response = client.post(
        f"/api/notes/{note['id']}/assistant",
        json={
            "messages": [
                {"role": "user", "content": "¿Qué es el ATP?"},
                {"role": "assistant", "content": "Es una molécula de energía."},
                {"role": "user", "content": "¿Dónde se produce?"},
            ]
        },
    )
    assert response.status_code == 200
    assert "¿Dónde se produce?" in response.get_json()["reply"]


def test_assistant_validation(client, note):
    url = f"/api/notes/{note['id']}/assistant"
    assert client.post(url, json={"messages": []}).status_code == 422
    assert (
        client.post(url, json={"messages": [{"role": "system", "content": "hola"}]}).status_code
        == 422
    )
    response = client.post(
        url,
        json={
            "messages": [
                {"role": "user", "content": "Hola"},
                {"role": "assistant", "content": "¿En qué te ayudo?"},
            ]
        },
    )
    assert response.status_code == 422
