import time
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from app.config import Settings


class SqlExecutionError(RuntimeError):
    pass


@dataclass
class QueryResult:
    columns: list[str]
    rows: list[list[Any]]
    execution_time_ms: int
    truncated: bool = False


class SqlServerExecutor:
    def __init__(self, settings: Settings):
        self.settings = settings

    def execute(self, query: str, max_rows: int | None = None) -> QueryResult:
        try:
            import pyodbc
        except ImportError as exc:
            raise RuntimeError("pyodbc is required for live SQL Server query execution.") from exc

        start = time.perf_counter()
        row_limit = self.settings.max_result_rows if max_rows is None else max_rows
        try:
            with pyodbc.connect(self._connection_string(), timeout=self.settings.query_timeout_seconds) as connection:
                connection.timeout = self.settings.query_timeout_seconds
                cursor = connection.cursor()
                cursor.execute(query)
                columns = [column[0] for column in cursor.description or []]
                fetched = cursor.fetchmany(row_limit + 1)
        except pyodbc.Error as exc:
            raise SqlExecutionError(_sanitize_error(str(exc))) from exc

        rows = [[_to_json_value(value) for value in row] for row in fetched[:row_limit]]
        elapsed = int((time.perf_counter() - start) * 1000)
        return QueryResult(columns=columns, rows=rows, execution_time_ms=elapsed, truncated=len(fetched) > row_limit)

    def _connection_string(self) -> str:
        return (
            "DRIVER={ODBC Driver 18 for SQL Server};"
            f"SERVER={self.settings.sql_server_host},{self.settings.sql_server_port};"
            f"DATABASE={self.settings.sql_server_database};"
            f"UID={self.settings.sql_server_user};"
            f"PWD={self.settings.sql_server_password};"
            "Encrypt=no;"
            "TrustServerCertificate=yes;"
        )


def _to_json_value(value: Any) -> Any:
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def _sanitize_error(message: str) -> str:
    first_line = message.replace("\r", "\n").split("\n", 1)[0]
    first_line = first_line.replace("ODBC Driver 18 for SQL Server", "SQL Server")
    return first_line[:500] or "SQL Server returned an error while running the query."
