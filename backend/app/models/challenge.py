from enum import Enum
from pydantic import BaseModel


class ComparisonMode(str, Enum):
    unordered = "unordered"
    ordered = "ordered"
    single_value = "single_value"


class Challenge(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    topic: str
    starter_sql: str
    reference_sql: str
    comparison_mode: ComparisonMode


class PublicChallenge(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    topic: str
    starter_sql: str
