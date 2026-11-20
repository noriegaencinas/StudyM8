"""Servidor de desarrollo de StudyMate.

Uso: python run.py
"""

import os

from studymate import create_app
from studymate.config import load_env_files

load_env_files()
app = create_app()

if __name__ == "__main__":
    app.run(
        # 0.0.0.0 para que la app en el teléfono pueda conectarse por la red local.
        host=os.getenv("FLASK_HOST", "0.0.0.0"),
        port=int(os.getenv("FLASK_PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
    )
