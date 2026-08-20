from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.challenges import router as challenges_router
from app.api.query import router as query_router
from app.api.schema import router as schema_router
from app.config import get_settings


settings = get_settings()

app = FastAPI(title="QueryRight SQLBank API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(challenges_router, prefix="/api")
app.include_router(schema_router, prefix="/api")
app.include_router(query_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
