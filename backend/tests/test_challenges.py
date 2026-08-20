from fastapi.testclient import TestClient

from app.main import app


def test_challenge_retrieval_hides_reference_sql():
    with TestClient(app) as client:
        response = client.get("/api/challenges")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 10
    assert "reference_sql" not in body[0]
    assert body[0]["title"] == "Basic SELECT"


def test_single_challenge_hides_reference_sql():
    with TestClient(app) as client:
        response = client.get("/api/challenges/1")

    assert response.status_code == 200
    assert "reference_sql" not in response.json()


def test_nonexistent_challenge():
    with TestClient(app) as client:
        response = client.get("/api/challenges/999")

    assert response.status_code == 404
