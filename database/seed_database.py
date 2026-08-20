import os
import random
from datetime import date, timedelta

import pyodbc


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


def connection(database: str = "master"):
    return pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={os.getenv('SQL_SERVER_HOST')},{os.getenv('SQL_SERVER_PORT', '1433')};"
        f"DATABASE={database};"
        f"UID={os.getenv('SQL_SERVER_USER')};"
        f"PWD={os.getenv('SQL_SERVER_PASSWORD')};"
        "Encrypt=no;TrustServerCertificate=yes;",
        autocommit=True,
    )


def main():
    database = os.getenv("SQL_SERVER_DATABASE", "SQLBankTraining")
    learner_password = os.getenv("SQLBANK_LEARNER_PASSWORD", "ChangeThis_StrongPassword123")
    with connection("master") as conn:
        cursor = conn.cursor()
        cursor.execute(f"IF DB_ID('{database}') IS NULL CREATE DATABASE {database};")
        cursor.execute(
            """
            IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = 'sqlbank_learner')
            BEGIN
                DECLARE @sql nvarchar(max) = 'CREATE LOGIN sqlbank_learner WITH PASSWORD = ''' + ? + ''', CHECK_POLICY = OFF;';
                EXEC(@sql);
            END
            """,
            learner_password,
        )

    with connection(database) as conn:
        cursor = conn.cursor()
        create_schema(cursor)
        seed(cursor)
        cursor.execute("""
            IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sqlbank_learner')
                CREATE USER sqlbank_learner FOR LOGIN sqlbank_learner;
            GRANT SELECT ON dbo.Customers TO sqlbank_learner;
            GRANT SELECT ON dbo.Branches TO sqlbank_learner;
            GRANT SELECT ON dbo.Applications TO sqlbank_learner;
            GRANT SELECT ON dbo.Loans TO sqlbank_learner;
            GRANT SELECT ON dbo.Payments TO sqlbank_learner;
        """)


def create_schema(cursor):
    cursor.execute("""
    DROP TABLE IF EXISTS Payments;
    DROP TABLE IF EXISTS Loans;
    DROP TABLE IF EXISTS Applications;
    DROP TABLE IF EXISTS Branches;
    DROP TABLE IF EXISTS Customers;

    CREATE TABLE Customers (
        CustomerID int NOT NULL PRIMARY KEY,
        FirstName nvarchar(50) NOT NULL,
        LastName nvarchar(50) NOT NULL,
        Province nvarchar(50) NOT NULL,
        City nvarchar(80) NOT NULL,
        DateOfBirth date NOT NULL,
        CustomerSince date NOT NULL
    );

    CREATE TABLE Branches (
        BranchID int NOT NULL PRIMARY KEY,
        BranchName nvarchar(100) NOT NULL,
        Province nvarchar(50) NOT NULL,
        City nvarchar(80) NOT NULL
    );

    CREATE TABLE Applications (
        ApplicationID int NOT NULL PRIMARY KEY,
        CustomerID int NOT NULL REFERENCES Customers(CustomerID),
        BranchID int NOT NULL REFERENCES Branches(BranchID),
        ApplicationDate date NOT NULL,
        RequestedAmount decimal(12,2) NOT NULL,
        Status nvarchar(20) NOT NULL,
        RiskScore int NOT NULL
    );

    CREATE TABLE Loans (
        LoanID int NOT NULL PRIMARY KEY,
        CustomerID int NOT NULL REFERENCES Customers(CustomerID),
        BranchID int NOT NULL REFERENCES Branches(BranchID),
        LoanAmount decimal(12,2) NOT NULL,
        InterestRate decimal(5,2) NOT NULL,
        StartDate date NOT NULL,
        LoanStatus nvarchar(20) NOT NULL
    );

    CREATE TABLE Payments (
        PaymentID int NOT NULL PRIMARY KEY,
        LoanID int NOT NULL REFERENCES Loans(LoanID),
        PaymentDate date NOT NULL,
        Amount decimal(12,2) NOT NULL,
        PaymentStatus nvarchar(20) NOT NULL
    );
    """)


def seed(cursor):
    branches = []
    branch_id = 1
    for province, cities in PROVINCES.items():
        for city in cities[:3]:
            if branch_id <= 20:
                branches.append((branch_id, f"{city} Advisory Centre", province, city))
                branch_id += 1
    while len(branches) < 20:
        province = RNG.choice(list(PROVINCES))
        city = RNG.choice(PROVINCES[province])
        branches.append((len(branches) + 1, f"{city} Service Hub {len(branches) + 1}", province, city))

    customers = []
    for customer_id in range(1001, 1501):
        province = RNG.choice(list(PROVINCES))
        city = RNG.choice(PROVINCES[province])
        dob = date(1955, 1, 1) + timedelta(days=RNG.randint(18 * 365, 55 * 365))
        since = date(2014, 1, 1) + timedelta(days=RNG.randint(0, 3650))
        customers.append((customer_id, RNG.choice(FIRST_NAMES), RNG.choice(LAST_NAMES), province, city, dob, since))

    applications = []
    loans = []
    loan_id = 5001
    for app_id in range(2001, 3501):
        customer = RNG.choice(customers)
        branch = RNG.choice(branches)
        risk_score = RNG.randint(420, 850)
        status = RNG.choices(["Approved", "Declined", "Pending"], weights=[56, 32, 12])[0]
        amount = round(RNG.uniform(1500, 45000), 2)
        applications.append((app_id, customer[0], branch[0], random_date(2021, 2025), amount, status, risk_score))
        if status == "Approved" and len(loans) < 700:
            loans.append((loan_id, customer[0], branch[0], amount, round(RNG.uniform(4.5, 14.5), 2), random_date(2021, 2026), RNG.choices(["Active", "Paid", "Delinquent", "Closed"], weights=[48, 28, 9, 15])[0]))
            loan_id += 1

    while len(loans) < 700:
        customer = RNG.choice(customers)
        branch = RNG.choice(branches)
        loans.append((loan_id, customer[0], branch[0], round(RNG.uniform(1500, 45000), 2), round(RNG.uniform(4.5, 14.5), 2), random_date(2021, 2026), "Active"))
        loan_id += 1

    payments = []
    for payment_id in range(9001, 14001):
        loan = RNG.choice(loans)
        payments.append((payment_id, loan[0], random_date(2022, 2026), round(loan[3] / RNG.randint(8, 36), 2), RNG.choices(["Completed", "Late", "Missed", "Reversed"], weights=[82, 10, 6, 2])[0]))

    insert_many(cursor, "Customers", customers)
    insert_many(cursor, "Branches", branches)
    insert_many(cursor, "Applications", applications)
    insert_many(cursor, "Loans", loans)
    insert_many(cursor, "Payments", payments)


def random_date(start_year, end_year):
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    return start + timedelta(days=RNG.randint(0, (end - start).days))


def insert_many(cursor, table, rows):
    placeholders = ",".join("?" for _ in rows[0])
    cursor.fast_executemany = True
    cursor.executemany(f"INSERT INTO {table} VALUES ({placeholders})", rows)


if __name__ == "__main__":
    main()
