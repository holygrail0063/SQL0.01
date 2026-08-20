from pydantic import BaseModel, Field


class QueryRunRequest(BaseModel):
    challengeId: int = Field(..., gt=0)
    query: str


class QueryRunResponse(BaseModel):
    success: bool
    correct: bool
    columns: list[str] = []
    rows: list[list[object | None]] = []
    executionTimeMs: int = 0
    truncated: bool = False
    rowCount: int = 0
    errorType: str | None = None
    message: str | None = None
