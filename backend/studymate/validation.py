"""Validación sencilla de los cuerpos JSON que recibe la API."""

import re
from typing import Any

from flask import request

from .errors import ApiError

REQUIRED_MESSAGE = "Este campo es obligatorio."


def json_body() -> dict[str, Any]:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "invalid_json", "El cuerpo de la petición debe ser un objeto JSON.")
    return data


class Validator:
    """Valida campos y acumula todos los errores para devolverlos juntos.

    Con `partial=True` (peticiones PATCH) los campos ausentes se ignoran.
    """

    def __init__(self, data: dict[str, Any], *, partial: bool = False) -> None:
        self.data = data
        self.partial = partial
        self.errors: dict[str, str] = {}
        self.values: dict[str, Any] = {}

    def _raw(self, field: str, *, required: bool, default: Any) -> tuple[bool, Any]:
        """Devuelve (hay_valor_para_validar, valor)."""
        value = self.data.get(field)
        if value is not None:
            return True, value
        if field not in self.data and self.partial:
            return False, None
        if required:
            self.errors[field] = REQUIRED_MESSAGE
            return False, None
        self.values[field] = default
        return False, None

    def text(
        self,
        field: str,
        *,
        max_length: int,
        required: bool = False,
        default: str = "",
        pattern: str | None = None,
        pattern_message: str = "Formato no válido.",
    ) -> None:
        present, value = self._raw(field, required=required, default=default)
        if not present:
            return
        if not isinstance(value, str):
            self.errors[field] = "Debe ser texto."
            return
        value = value.strip()
        if required and not value:
            self.errors[field] = REQUIRED_MESSAGE
        elif len(value) > max_length:
            self.errors[field] = f"Máximo {max_length} caracteres."
        elif pattern and value and not re.fullmatch(pattern, value):
            self.errors[field] = pattern_message
        else:
            self.values[field] = value

    def integer(
        self, field: str, *, minimum: int, maximum: int, default: int | None = None
    ) -> None:
        present, value = self._raw(field, required=default is None, default=default)
        if not present:
            return
        if isinstance(value, bool) or not isinstance(value, int):
            self.errors[field] = "Debe ser un número entero."
        elif not minimum <= value <= maximum:
            self.errors[field] = f"Debe estar entre {minimum} y {maximum}."
        else:
            self.values[field] = value

    def boolean(self, field: str) -> None:
        present, value = self._raw(field, required=True, default=None)
        if not present:
            return
        if not isinstance(value, bool):
            self.errors[field] = "Debe ser verdadero o falso."
        else:
            self.values[field] = value

    def validate(self) -> dict[str, Any]:
        if self.errors:
            raise ApiError(422, "validation_error", "Revisa los datos enviados.", self.errors)
        return self.values
