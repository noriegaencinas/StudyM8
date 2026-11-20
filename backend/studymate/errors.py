"""Errores de la API con un formato JSON uniforme.

Todas las respuestas de error tienen la forma:
    {"error": {"code": "...", "message": "...", "fields": {...}}}
"""

import logging
from typing import Any

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)

_HTTP_MESSAGES = {
    400: "La petición no es válida.",
    404: "El recurso solicitado no existe.",
    405: "Método no permitido.",
    413: "La petición es demasiado grande.",
}


class ApiError(Exception):
    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        fields: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields

    def to_dict(self) -> dict[str, Any]:
        error: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.fields:
            error["fields"] = self.fields
        return {"error": error}


def not_found(label: str) -> ApiError:
    return ApiError(404, "not_found", f"{label} no existe.")


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return jsonify(error.to_dict()), error.status

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        status = error.code or 500
        message = _HTTP_MESSAGES.get(status, error.description or "Error en la petición.")
        code = (error.name or "error").lower().replace(" ", "_")
        return jsonify({"error": {"code": code, "message": message}}), status

    @app.errorhandler(Exception)
    def handle_unexpected(error: Exception):
        logger.exception("Error inesperado", exc_info=error)
        body = {"error": {"code": "internal_error", "message": "Ocurrió un error en el servidor."}}
        return jsonify(body), 500
