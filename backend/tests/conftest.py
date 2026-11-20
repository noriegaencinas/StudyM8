import pytest

from studymate import create_app

TEST_CONFIG = {
    "TESTING": True,
    "SQLALCHEMY_DATABASE_URI": "sqlite://",
    "AI_PROVIDER": "mock",
    "AI_API_KEY": "",
    "AI_MODEL": "claude-sonnet-5-5",
}


@pytest.fixture
def make_app():
    """Crea una app de prueba con configuración adicional."""
    return lambda **overrides: create_app({**TEST_CONFIG, **overrides})


@pytest.fixture
def app(make_app):
    return make_app()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def subject(client):
    response = client.post("/api/subjects", json={"name": "Biología", "color": "#16A34A"})
    assert response.status_code == 201
    return response.get_json()


@pytest.fixture
def note(client, subject):
    response = client.post(
        f"/api/subjects/{subject['id']}/notes",
        json={
            "title": "La célula",
            "content": (
                "La célula es la unidad básica de la vida. "
                "La mitocondria produce energía en forma de ATP. "
                "El núcleo contiene el ADN."
            ),
        },
    )
    assert response.status_code == 201
    return response.get_json()
