import random
import re
import sqlite3
import tempfile
import time
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Iterator

from app.config import Settings
from app.services.sql_executor import QueryResult, SqlExecutionError


RNG = random.Random(1017)
PROVINCES = {
    "Ontario": ["Toronto", "Ottawa", "Hamilton", "London"],
    "Quebec": ["Montreal", "Quebec City", "Laval"],
    "British Columbia": ["Vancouver", "Victoria", "Kelowna"],
    "Alberta": ["Calgary", "Edmonton", "Red Deer"],
    "Manitoba": ["Winnipeg", "Brandon"],
    "Nova Scotia": ["Halifax", "Dartmouth"],
    "Saskatchewan": ["Regina", "Saskatoon"],
}
FIRST_NAMES = ["Maya", "Daniel", "Sofia", "Ethan", "Priya", "Noah", "Ava", "Liam", "Olivia", "Lucas", "Nora", "Arjun"]
LAST_NAMES = ["Chen", "Singh", "Martin", "Patel", "Brown", "Wilson", "Roy", "Nguyen", "Taylor", "Anderson", "Campbell", "Kaur"]


class SqliteTrainingExecutor:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.database_path = _database_path(settings.sqlite_database_path)
        self._ensure_database()

    def execute(self, query: str, max_rows: int | None = None) -> QueryResult:
        start = time.perf_counter()
        row_limit = self.settings.max_result_rows if max_rows is None else max_rows
        started_at = time.monotonic()

        try:
            with self._connection() as connection:
                connection.set_progress_handler(
                    lambda: 1 if time.monotonic() - started_at > self.settings.query_timeout_seconds else 0,
                    1000,
                )
                cursor = connection.execute(_to_sqlite_query(query))
                columns = [description[0] for description in cursor.description or []]
                fetched = cursor.fetchmany(row_limit + 1)
        except sqlite3.Error as exc:
            raise SqlExecutionError(_sanitize_sqlite_error(str(exc))) from exc

        elapsed = int((time.perf_counter() - start) * 1000)
        rows = [list(row) for row in fetched[:row_limit]]
        return QueryResult(columns=columns, rows=rows, execution_time_ms=elapsed, truncated=len(fetched) > row_limit)

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA query_only = ON;")
        try:
            yield connection
        finally:
            connection.close()

    def _ensure_database(self) -> None:
        if self.database_path.exists():
            return
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.database_path)
        try:
            _create_schema(connection)
            _seed(connection)
            connection.commit()
        finally:
            connection.close()


def _to_sqlite_query(query: str) -> str:
    normalized = query.strip().rstrip(";")
    match = re.match(r"(?is)^select\s+top\s+(\d+)\s+(.*)$", normalized)
    if match:
        limit = match.group(1)
        body = match.group(2).strip()
        if not re.search(r"(?is)\blimit\s+\d+\s*$", body):
            return f"SELECT {body} LIMIT {limit}"
    return normalized


def _database_path(configured_path: str) -> Path:
    if configured_path.strip():
        return Path(configured_path)
    return Path(tempfile.gettempdir()) / "queryright_sqlbank_training.sqlite3"


def _create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE Customers (
            CustomerID integer NOT NULL PRIMARY KEY,
            FirstName text NOT NULL,
            LastName text NOT NULL,
            Province text NOT NULL,
            City text NOT NULL,
            DateOfBirth text NOT NULL,
            CustomerSince text NOT NULL
        );

        CREATE TABLE Branches (
            BranchID integer NOT NULL PRIMARY KEY,
            BranchName text NOT NULL,
            Province text NOT NULL,
            City text NOT NULL
        );

        CREATE TABLE Applications (
            ApplicationID integer NOT NULL PRIMARY KEY,
            CustomerID integer NOT NULL REFERENCES Customers(CustomerID),
            BranchID integer NOT NULL REFERENCES Branches(BranchID),
            ApplicationDate text NOT NULL,
            RequestedAmount real NOT NULL,
            Status text NOT NULL,
            RiskScore integer NOT NULL
        );

        CREATE TABLE Loans (
            LoanID integer NOT NULL PRIMARY KEY,
            CustomerID integer NOT NULL REFERENCES Customers(CustomerID),
            BranchID integer NOT NULL REFERENCES Branches(BranchID),
            LoanAmount real NOT NULL,
            InterestRate real NOT NULL,
            StartDate text NOT NULL,
            LoanStatus text NOT NULL
        );

        CREATE TABLE Payments (
            PaymentID integer NOT NULL PRIMARY KEY,
            LoanID integer NOT NULL REFERENCES Loans(LoanID),
            PaymentDate text NOT NULL,
            Amount real NOT NULL,
            PaymentStatus text NOT NULL
        );
        """
    )


def _seed(connection: sqlite3.Connection) -> None:
    rng = random.Random(1017)
    branches = []
    branch_id = 1
    for province, cities in PROVINCES.items():
        for city in cities[:3]:
            if branch_id <= 20:
                branches.append((branch_id, f"{city} Advisory Centre", province, city))
                branch_id += 1
    while len(branches) < 20:
        province = rng.choice(list(PROVINCES))
        city = rng.choice(PROVINCES[province])
        branches.append((len(branches) + 1, f"{city} Service Hub {len(branches) + 1}", province, city))

    customers = []
    for customer_id in range(1001, 1501):
        province = rng.choice(list(PROVINCES))
        city = rng.choice(PROVINCES[province])
        dob = date(1955, 1, 1) + timedelta(days=rng.randint(18 * 365, 55 * 365))
        since = date(2014, 1, 1) + timedelta(days=rng.randint(0, 3650))
        customers.append((customer_id, rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES), province, city, dob.isoformat(), since.isoformat()))

    applications = []
    loans = []
    loan_id = 5001
    for app_id in range(2001, 3501):
        customer = rng.choice(customers)
        branch = rng.choice(branches)
        risk_score = rng.randint(420, 850)
        status = rng.choices(["Approved", "Declined", "Pending"], weights=[56, 32, 12])[0]
        amount = round(rng.uniform(1500, 45000), 2)
        applications.append((app_id, customer[0], branch[0], _random_date(rng, 2021, 2025), amount, status, risk_score))
        if status == "Approved" and len(loans) < 700:
            loans.append((loan_id, customer[0], branch[0], amount, round(rng.uniform(4.5, 14.5), 2), _random_date(rng, 2021, 2026), rng.choices(["Active", "Paid", "Delinquent", "Closed"], weights=[48, 28, 9, 15])[0]))
            loan_id += 1

    while len(loans) < 700:
        customer = rng.choice(customers)
        branch = rng.choice(branches)
        loans.append((loan_id, customer[0], branch[0], round(rng.uniform(1500, 45000), 2), round(rng.uniform(4.5, 14.5), 2), _random_date(rng, 2021, 2026), "Active"))
        loan_id += 1

    payments = []
    for payment_id in range(9001, 14001):
        loan = rng.choice(loans)
        payments.append((payment_id, loan[0], _random_date(rng, 2022, 2026), round(loan[3] / rng.randint(8, 36), 2), rng.choices(["Completed", "Late", "Missed", "Reversed"], weights=[82, 10, 6, 2])[0]))

    connection.executemany("INSERT INTO Customers VALUES (?, ?, ?, ?, ?, ?, ?)", customers)
    connection.executemany("INSERT INTO Branches VALUES (?, ?, ?, ?)", branches)
    connection.executemany("INSERT INTO Applications VALUES (?, ?, ?, ?, ?, ?, ?)", applications)
    connection.executemany("INSERT INTO Loans VALUES (?, ?, ?, ?, ?, ?, ?)", loans)
    connection.executemany("INSERT INTO Payments VALUES (?, ?, ?, ?, ?)", payments)


def _random_date(rng: random.Random, start_year: int, end_year: int) -> str:
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    return (start + timedelta(days=rng.randint(0, (end - start).days))).isoformat()


def _sanitize_sqlite_error(message: str) -> str:
    if "interrupted" in message.lower():
        return "Query timed out before it could finish."
    return message[:500] or "The training database returned an error while running the query."
