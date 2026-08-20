from decimal import Decimal, InvalidOperation
from app.models.challenge import ComparisonMode


def compare_results(
    user_rows: list[list[object | None]],
    reference_rows: list[list[object | None]],
    mode: ComparisonMode,
) -> bool:
    if mode == ComparisonMode.single_value:
        return _first_scalar(user_rows) == _first_scalar(reference_rows)

    normalized_user = [_normalize_row(row) for row in user_rows]
    normalized_reference = [_normalize_row(row) for row in reference_rows]

    if mode == ComparisonMode.ordered:
        return normalized_user == normalized_reference

    return sorted(normalized_user) == sorted(normalized_reference)


def _first_scalar(rows: list[list[object | None]]) -> object | None:
    if not rows or not rows[0]:
        return None
    return _normalize_value(rows[0][0])


def _normalize_row(row: list[object | None]) -> tuple[str, ...]:
    return tuple(str(_normalize_value(value)) for value in row)


def _normalize_value(value: object | None) -> object | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip()
    try:
        return Decimal(str(value)).quantize(Decimal("0.0001")).normalize()
    except (InvalidOperation, ValueError):
        return value
