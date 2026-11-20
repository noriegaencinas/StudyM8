def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_create_and_list_subjects(client):
    client.post("/api/subjects", json={"name": "química"})
    client.post("/api/subjects", json={"name": "Álgebra", "description": "Primer semestre"})

    response = client.get("/api/subjects")
    assert response.status_code == 200
    subjects = response.get_json()
    assert [s["name"] for s in subjects] == ["Álgebra", "química"]
    assert subjects[0]["description"] == "Primer semestre"
    assert subjects[0]["note_count"] == 0
    assert subjects[1]["color"] == "#2563EB"


def test_create_subject_trims_and_validates(client):
    response = client.post("/api/subjects", json={"name": "   ", "color": "azul"})
    assert response.status_code == 422
    error = response.get_json()["error"]
    assert error["code"] == "validation_error"
    assert set(error["fields"]) == {"name", "color"}

    response = client.post("/api/subjects", json={"name": "  Física  "})
    assert response.get_json()["name"] == "Física"


def test_create_subject_rejects_non_json(client):
    response = client.post("/api/subjects", data="hola", content_type="text/plain")
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "invalid_json"


def test_read_update_subject(client, subject):
    response = client.patch(f"/api/subjects/{subject['id']}", json={"description": "Nueva"})
    assert response.status_code == 200
    body = response.get_json()
    assert body["name"] == "Biología"
    assert body["description"] == "Nueva"

    response = client.patch(f"/api/subjects/{subject['id']}", json={"name": None})
    assert response.status_code == 422

    response = client.get(f"/api/subjects/{subject['id']}")
    assert response.get_json()["description"] == "Nueva"


def test_missing_subject_returns_404(client):
    response = client.get("/api/subjects/999")
    assert response.status_code == 404
    assert response.get_json()["error"]["message"] == "La materia no existe."


def test_delete_subject_cascades_notes(client, subject, note):
    response = client.delete(f"/api/subjects/{subject['id']}")
    assert response.status_code == 204
    assert client.get(f"/api/notes/{note['id']}").status_code == 404
    assert client.get("/api/subjects").get_json() == []
