"""Validación sencilla de los cuerpos JSON que recibe la API."""

import re
from typing import Any

from flask import request
from pydantic import BaseModel, ValidationError

from .errors import ApiError

REQUIRED_MESSAGE = "Este campo es obligatorio."


def json_body(*, optional: bool = False) -> dict[str, Any]:
    """Devuelve el cuerpo JSON. Con `optional=True` un cuerpo vacío equivale a `{}`."""
    if optional and not request.get_data():
        return {}
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "invalid_json", "El cuerpo de la petición debe ser un objeto JSON.")
    return data


def _pydantic_message(issue: Any) -> str:
    kind = issue["type"]
    ctx = issue.get("ctx") or {}
    if kind == "missing":
        return REQUIRED_MESSAGE
    if kind == "string_too_short":
        return "No puede estar vacío."
    if kind == "string_too_long":
        return f"Máximo {ctx.get('max_length')} caracteres."
    if kind in {"too_short", "too_long"}:
        return "La cantidad de elementos no es válida."
    if kind in {"string_type"}:
        return "Debe ser texto."
    if kind in {"int_type", "int_parsing", "int_from_float"}:
        return "Debe ser un número entero."
    if kind in {"less_than", "greater_than_equal", "less_than_equal", "greater_than"}:
        return "El valor está fuera de rango."
    if kind == "literal_error":
        return "Valor no permitido."
    return "Valor no válido."


def parse_model[T: BaseModel](model: type[T], data: Any) -> T:
    """Valida `data` con un modelo Pydantic y traduce los errores al formato de la API."""
    try:
        return model.model_validate(data)
    except ValidationError as error:
        fields: dict[str, str] = {}
        for issue in error.errors():
            key = ".".join(str(part) for part in issue["loc"]) or "body"
            fields.setdefault(key, _pydantic_message(issue))
        raise ApiError(422, "validation_error", "Revisa los datos enviados.", fields) from error


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
