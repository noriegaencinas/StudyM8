"""Configuración del backend a partir de variables de entorno."""

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent


def load_env_files() -> None:
    """Carga `backend/.env` y, como respaldo, el `.env` de la raíz del repositorio.

    Las variables ya definidas en el entorno tienen prioridad, y `backend/.env`
    tiene prioridad sobre el de la raíz.
    """
    load_dotenv(BACKEND_DIR / ".env")
    load_dotenv(ROOT_DIR / ".env")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def config_from_env() -> dict[str, Any]:
    return {
        "SECRET_KEY": os.getenv("SECRET_KEY", "dev-insecure-key"),
        # Las rutas SQLite relativas se resuelven dentro de backend/instance/.
        "SQLALCHEMY_DATABASE_URI": os.getenv("DATABASE_URL", "sqlite:///studymate.db"),
        "CORS_ORIGINS": _split_csv(os.getenv("CORS_ORIGINS", "http://localhost:8081")),
        "AI_PROVIDER": os.getenv("AI_PROVIDER", "anthropic").strip().lower(),
        "AI_API_KEY": os.getenv("AI_API_KEY", "").strip(),
        "AI_MODEL": os.getenv("AI_MODEL", "claude-sonnet-5-5").strip(),
    }
