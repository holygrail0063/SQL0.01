from app.api.query import get_executor
from app.main import app
from app.services.sql_executor import QueryResult, SqlExecutionError
from fastapi.testclient import TestClient


class FakeExecutor:
    def execute(self, query: str, max_rows: int | None = None) -> QueryResult:
        normalized = " ".join(query.lower().split())
        if "syntax_error" in normalized:
            raise SqlExecutionError("Incorrect syntax near 'syntax_error'.")
        if "from customers" in normalized:
            return QueryResult(["CustomerID", "FirstName"], [[1, "Maya"], [2, "Daniel"]], 12)
        if "count(*)" in normalized and "applications" in normalized:
            return QueryResult(["ApplicationCount"], [[1500]], 8)
        return QueryResult(["Value"], [[999]], 7)


def make_client() -> TestClient:
    app.dependency_overrides[get_executor] = lambda: FakeExecutor()
    return TestClient(app)


def teardown_function():
    app.dependency_overrides.clear()


def test_valid_query_returns_correct():
    with make_client() as client:
        response = client.post("/api/query/run", json={"challengeId": 1, "query": "SELECT * FROM Customers;"})

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["correct"] is True


def test_valid_query_returns_incorrect():
    with make_client() as client:
        response = client.post("/api/query/run", json={"challengeId": 1, "query": "SELECT 999 AS Value;"})

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["correct"] is False


def test_invalid_sql_syntax_is_safe_error():
    with make_client() as client:
        response = client.post("/api/query/run", json={"challengeId": 1, "query": "SELECT syntax_error"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert body["errorType"] == "sql_error"
    assert "syntax_error" in body["message"]


def test_prohibited_delete_query():
    with make_client() as client:
        response = client.post("/api/query/run", json={"challengeId": 1, "query": "DELETE FROM Customers"})

    assert response.status_code == 200
    assert response.json()["errorType"] == "validation_error"


def test_nonexistent_challenge_run():
    with make_client() as client:
        response = client.post("/api/query/run", json={"challengeId": 999, "query": "SELECT * FROM Customers"})

    assert response.status_code == 404
