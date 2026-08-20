from fastapi import APIRouter

from app.services.schema import get_public_schema

router = APIRouter()


@router.get("/schema")
def schema() -> list[dict[str, object]]:
    return get_public_schema()
