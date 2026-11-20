from flask import Flask

from . import assistant, flashcards, health, notes, progress, quizzes, subjects


def register_blueprints(app: Flask) -> None:
    for module in (health, subjects, notes, flashcards, quizzes, assistant, progress):
        app.register_blueprint(module.bp)
