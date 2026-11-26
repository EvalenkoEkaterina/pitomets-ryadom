from typing import TypedDict


class ValidationResult(TypedDict):
    is_valid: bool
    species: str | None
    breed: str | None


async def _run_stage_one(image_bytes: bytes) -> dict | None:
    """Первичный лёгкий классификатор (fast-path)."""
    _ = image_bytes
    return None


async def _run_stage_two(image_bytes: bytes) -> dict | None:
    """Вторичный глубокий классификатор (fallback)."""
    _ = image_bytes
    return None


async def activate_llm_validation(
    text: str,
    image_bytes: bytes | None = None,
    content_type: str | None = None,
) -> ValidationResult:
    """
    Базовый интерфейс каскадной обработки входных данных.
    """
    _ = (text, content_type)

    if not image_bytes:
        return {"is_valid": True, "species": None, "breed": None}

    stage_one_res = await _run_stage_one(image_bytes)
    if stage_one_res:
        return {"is_valid": True, "species": None, "breed": None, **stage_one_res}

    stage_two_res = await _run_stage_two(image_bytes)
    if stage_two_res:
        return {"is_valid": True, "species": None, "breed": None, **stage_two_res}

    return {"is_valid": True, "species": None, "breed": None}
