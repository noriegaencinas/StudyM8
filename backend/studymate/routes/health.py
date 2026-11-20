from flask import Blueprint, jsonify

from ..ai import ai_status

bp = Blueprint("health", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    return jsonify({"status": "ok", "ai": ai_status()})
