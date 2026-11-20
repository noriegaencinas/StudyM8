from flask import Flask

from . import health, notes, subjects


def register_blueprints(app: Flask) -> None:
    for module in (health, subjects, notes):
        app.register_blueprint(module.bp)
