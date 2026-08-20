from fastapi import APIRouter, Depends, HTTPException

from app.config import Settings, get_settings
from app.models.query import QueryRunRequest, QueryRunResponse
from app.services.challenges import get_challenge
from app.services.query_validator import QueryValidationError, validate_read_only_query
from app.services.result_compare import compare_results
from app.services.sql_executor import SqlExecutionError, SqlServerExecutor

router = APIRouter()


def get_executor(settings: Settings = Depends(get_settings)) -> SqlServerExecutor:
    return SqlServerExecutor(settings)


@router.post("/query/run", response_model=QueryRunResponse)
def run_query(
    request: QueryRunRequest,
    settings: Settings = Depends(get_settings),
    executor: SqlServerExecutor = Depends(get_executor),
) -> QueryRunResponse:
    challenge = get_challenge(request.challengeId)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Challenge not found")

    try:
        user_sql = validate_read_only_query(request.query, settings.max_query_length)
    except QueryValidationError as exc:
        return QueryRunResponse(success=False, correct=False, errorType="validation_error", message=str(exc))

    try:
        user_result = executor.execute(user_sql)
        reference_result = executor.execute(challenge.reference_sql, max_rows=5000)
    except SqlExecutionError as exc:
        return QueryRunResponse(success=False, correct=False, errorType="sql_error", message=str(exc))
    except RuntimeError as exc:
        message = str(exc)
        if "pyodbc" in message.lower():
            message = "SQL Server execution is not configured. Install pyodbc in the backend environment and make sure SQL Server is running."
        else:
            message = "The SQL execution service is not configured correctly."
        return QueryRunResponse(success=False, correct=False, errorType="backend_error", message=message)
    except Exception:
        return QueryRunResponse(success=False, correct=False, errorType="backend_error", message="The query could not be completed.")

    correct = compare_results(user_result.rows, reference_result.rows, challenge.comparison_mode)
    return QueryRunResponse(
        success=True,
        correct=correct,
        columns=user_result.columns,
        rows=user_result.rows,
        executionTimeMs=user_result.execution_time_ms,
        truncated=user_result.truncated,
        rowCount=len(user_result.rows),
        message=None if correct else "Not quite. Your query ran successfully, but the result does not match the expected result.",
    )
