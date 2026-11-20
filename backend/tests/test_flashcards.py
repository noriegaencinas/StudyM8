def test_generate_flashcards_with_mock(client, note):
    response = client.post(f"/api/notes/{note['id']}/flashcards/generate", json={"count": 2})
    assert response.status_code == 200
    cards = response.get_json()["flashcards"]
    assert len(cards) == 2
    assert cards[0]["back"] == "La célula es la unidad básica de la vida."
    assert cards[0]["front"]

    # Generar no guarda nada.
    assert client.get(f"/api/notes/{note['id']}/flashcards").get_json() == []


def test_generate_flashcards_without_body_uses_default(client, note):
    response = client.post(f"/api/notes/{note['id']}/flashcards/generate")
    assert response.status_code == 200
    assert len(response.get_json()["flashcards"]) == 3  # el apunte tiene 3 oraciones


def test_generate_flashcards_validates_count(client, note):
    for count in (0, 21, "5", True):
        response = client.post(
            f"/api/notes/{note['id']}/flashcards/generate", json={"count": count}
        )
        assert response.status_code == 422, count


def test_generate_requires_enough_content(client, subject):
    short = client.post(
        f"/api/subjects/{subject['id']}/notes", json={"title": "Corto", "content": "Muy breve"}
    ).get_json()
    response = client.post(f"/api/notes/{short['id']}/flashcards/generate", json={})
    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "note_too_short"


def test_save_list_update_and_delete_flashcards(client, note):
    response = client.post(
        f"/api/notes/{note['id']}/flashcards",
        json={"flashcards": [{"front": " ¿Qué es la célula? ", "back": "La unidad de la vida."}]},
    )
    assert response.status_code == 201
    card = response.get_json()[0]
    assert card["front"] == "¿Qué es la célula?"
    assert card["known_count"] == 0

    response = client.patch(f"/api/flashcards/{card['id']}", json={"back": "Unidad básica."})
    assert response.get_json()["back"] == "Unidad básica."

    cards = client.get(f"/api/notes/{note['id']}/flashcards").get_json()
    assert [c["id"] for c in cards] == [card["id"]]

    assert client.delete(f"/api/flashcards/{card['id']}").status_code == 204
    assert client.get(f"/api/notes/{note['id']}/flashcards").get_json() == []


def test_save_flashcards_validation(client, note):
    response = client.post(f"/api/notes/{note['id']}/flashcards", json={"flashcards": []})
    assert response.status_code == 422

    response = client.post(
        f"/api/notes/{note['id']}/flashcards", json={"flashcards": [{"front": "Sin reverso"}]}
    )
    assert response.status_code == 422
    assert response.get_json()["error"]["fields"] == {
        "flashcards.0.back": "Este campo es obligatorio."
    }


def test_review_flashcard(client, note):
    card = client.post(
        f"/api/notes/{note['id']}/flashcards",
        json={"flashcards": [{"front": "A", "back": "B"}]},
    ).get_json()[0]

    client.post(f"/api/flashcards/{card['id']}/review", json={"known": True})
    client.post(f"/api/flashcards/{card['id']}/review", json={"known": True})
    response = client.post(f"/api/flashcards/{card['id']}/review", json={"known": False})

    body = response.get_json()
    assert (body["known_count"], body["unknown_count"]) == (2, 1)
    assert body["last_reviewed_at"].endswith("Z")

    response = client.post(f"/api/flashcards/{card['id']}/review", json={"known": "si"})
    assert response.status_code == 422


def test_deleting_note_deletes_its_flashcards(client, note):
    card = client.post(
        f"/api/notes/{note['id']}/flashcards",
        json={"flashcards": [{"front": "A", "back": "B"}]},
    ).get_json()[0]
    client.delete(f"/api/notes/{note['id']}")
    assert client.patch(f"/api/flashcards/{card['id']}", json={"front": "x"}).status_code == 404


def test_health_reports_mock_ai(client):
    assert client.get("/api/health").get_json()["ai"] == {"provider": "mock", "configured": True}


def test_ai_not_configured_returns_503(make_app):
    client = make_app(AI_PROVIDER="anthropic", AI_API_KEY="tu-clave-aqui").test_client()
    subject = client.post("/api/subjects", json={"name": "Física"}).get_json()
    created = client.post(
        f"/api/subjects/{subject['id']}/notes",
        json={"title": "Newton", "content": "La fuerza es igual a la masa por la aceleración."},
    ).get_json()

    health = client.get("/api/health").get_json()
    assert health["ai"] == {
        "provider": "anthropic",
        "configured": False,
        "model": "claude-sonnet-5-5",
    }

    response = client.post(f"/api/notes/{created['id']}/flashcards/generate", json={})
    assert response.status_code == 503
    assert response.get_json()["error"]["code"] == "ai_not_configured"
