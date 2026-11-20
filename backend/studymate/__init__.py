"""Backend de StudyMate (Flask + SQLite)."""

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from flask import Flask
from flask_cors import CORS

from . import models  # noqa: F401  (registra las tablas antes de create_all)
from .config import config_from_env
from .errors import register_error_handlers
from .extensions import db
from .routes import register_blueprints


def create_app(overrides: Mapping[str, Any] | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.update(config_from_env())
    app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024
    if overrides:
        app.config.update(overrides)

    app.json.ensure_ascii = False  # type: ignore[attr-defined]
    app.json.sort_keys = False  # type: ignore[attr-defined]

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    register_error_handlers(app)
    register_blueprints(app)

    with app.app_context():
        db.create_all()

    return app
