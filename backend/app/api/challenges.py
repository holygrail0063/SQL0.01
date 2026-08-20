from fastapi import APIRouter, HTTPException

from app.models.challenge import PublicChallenge
from app.services.challenges import get_challenge, list_challenges, to_public

router = APIRouter()


@router.get("/challenges", response_model=list[PublicChallenge])
def all_challenges() -> list[PublicChallenge]:
    return list_challenges()


@router.get("/challenges/{challenge_id}", response_model=PublicChallenge)
def one_challenge(challenge_id: int) -> PublicChallenge:
    challenge = get_challenge(challenge_id)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return to_public(challenge)
