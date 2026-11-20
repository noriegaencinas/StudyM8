def test_create_note_returns_full_note(note, subject):
    assert note["title"] == "La célula"
    assert note["subject"] == {"id": subject["id"], "name": "Biología", "color": "#16A34A"}
    assert note["content"].startswith("La célula")
    assert note["created_at"].endswith("Z")


def test_list_notes_and_note_count(client, subject, note):
    client.post(f"/api/subjects/{subject['id']}/notes", json={"title": "Tejidos"})

    notes = client.get(f"/api/subjects/{subject['id']}/notes").get_json()
    assert [n["title"] for n in notes] == ["Tejidos", "La célula"]
    assert "content" not in notes[0]
    assert notes[1]["excerpt"].startswith("La célula es la unidad")

    assert client.get(f"/api/subjects/{subject['id']}").get_json()["note_count"] == 2
    assert client.get("/api/subjects").get_json()[0]["note_count"] == 2


def test_excerpt_is_truncated(client, subject):
    response = client.post(
        f"/api/subjects/{subject['id']}/notes",
        json={"title": "Largo", "content": "palabra " * 100},
    )
    excerpt = response.get_json()["excerpt"]
    assert len(excerpt) == 160
    assert excerpt.endswith("…")


def test_create_note_validation(client, subject):
    response = client.post(f"/api/subjects/{subject['id']}/notes", json={"content": "sin título"})
    assert response.status_code == 422
    assert response.get_json()["error"]["fields"] == {"title": "Este campo es obligatorio."}

    response = client.post("/api/subjects/999/notes", json={"title": "x"})
    assert response.status_code == 404


def test_update_note(client, note):
    response = client.patch(f"/api/notes/{note['id']}", json={"content": "Contenido nuevo"})
    assert response.status_code == 200
    body = response.get_json()
    assert body["title"] == "La célula"
    assert body["content"] == "Contenido nuevo"


def test_delete_note(client, note):
    assert client.delete(f"/api/notes/{note['id']}").status_code == 204
    assert client.get(f"/api/notes/{note['id']}").status_code == 404
    assert client.delete(f"/api/notes/{note['id']}").status_code == 404


def test_unknown_route_returns_json_404(client):
    response = client.get("/api/no-existe")
    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "not_found"
