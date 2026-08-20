from app.models.challenge import Challenge, ComparisonMode, PublicChallenge


_CHALLENGES: list[Challenge] = [
    Challenge(
        id=1,
        title="Basic SELECT",
        description="Your SQLBank analytics manager needs a full customer extract. Query the Customers table and return every customer record.",
        difficulty="Beginner",
        topic="SELECT",
        starter_sql="SELECT\nFROM Customers;",
        reference_sql="SELECT * FROM Customers;",
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=2,
        title="WHERE",
        description="Your SQLBank analytics manager needs a list of customers located in Ontario. Query the Customers table and return the requested records.",
        difficulty="Beginner",
        topic="WHERE",
        starter_sql="SELECT *\nFROM Customers\nWHERE ...;",
        reference_sql="SELECT * FROM Customers WHERE Province = 'Ontario';",
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=3,
        title="ORDER BY",
        description="SQLBank wants to review its largest lending exposures first. Display all loans from the largest loan amount to the smallest loan amount.",
        difficulty="Beginner",
        topic="ORDER BY",
        starter_sql="SELECT *\nFROM Loans\nORDER BY ...;",
        reference_sql="SELECT * FROM Loans ORDER BY LoanAmount DESC;",
        comparison_mode=ComparisonMode.ordered,
    ),
    Challenge(
        id=4,
        title="COUNT",
        description="The operations team needs a single count of total loan applications received by SQLBank.",
        difficulty="Beginner",
        topic="COUNT",
        starter_sql="SELECT COUNT(*) AS ApplicationCount\nFROM Applications;",
        reference_sql="SELECT COUNT(*) AS ApplicationCount FROM Applications;",
        comparison_mode=ComparisonMode.single_value,
    ),
    Challenge(
        id=5,
        title="GROUP BY",
        description="Summarize application volume by status so SQLBank can compare Approved, Declined, and Pending application counts.",
        difficulty="Beginner",
        topic="GROUP BY",
        starter_sql="SELECT Status, COUNT(*) AS ApplicationCount\nFROM Applications\nGROUP BY Status;",
        reference_sql="SELECT Status, COUNT(*) AS ApplicationCount FROM Applications GROUP BY Status;",
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=6,
        title="SUM + JOIN",
        description="SQLBank leadership wants provincial lending totals. Calculate the total loan amount issued in each province.",
        difficulty="Intermediate",
        topic="Aggregation",
        starter_sql="SELECT b.Province, SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Loans l\nJOIN Branches b ON ...\nGROUP BY b.Province;",
        reference_sql="""
            SELECT b.Province, SUM(l.LoanAmount) AS TotalLoanAmount
            FROM Loans l
            INNER JOIN Branches b ON l.BranchID = b.BranchID
            GROUP BY b.Province;
        """,
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=7,
        title="INNER JOIN",
        description="The loan servicing team needs customer names beside each loan. Display every loan with the customer's first and last name.",
        difficulty="Intermediate",
        topic="JOIN",
        starter_sql="SELECT l.LoanID, c.FirstName, c.LastName, l.LoanAmount\nFROM Loans l\nJOIN Customers c ON ...;",
        reference_sql="""
            SELECT l.LoanID, c.FirstName, c.LastName, l.LoanAmount
            FROM Loans l
            INNER JOIN Customers c ON l.CustomerID = c.CustomerID;
        """,
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=8,
        title="Multiple Tables",
        description="Calculate the total value of loans issued by each SQLBank branch. Include branch name and total loan amount.",
        difficulty="Intermediate",
        topic="Multi-table JOIN",
        starter_sql="SELECT b.BranchName, SUM(l.LoanAmount) AS TotalLoanAmount\nFROM Branches b\nJOIN Loans l ON ...\nGROUP BY b.BranchName;",
        reference_sql="""
            SELECT b.BranchName, SUM(l.LoanAmount) AS TotalLoanAmount
            FROM Branches b
            INNER JOIN Loans l ON b.BranchID = l.BranchID
            GROUP BY b.BranchName;
        """,
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=9,
        title="CASE",
        description="Create a simple portfolio size label for every loan. Small: less than 5000. Medium: 5000 to less than 15000. Large: 15000 or more.",
        difficulty="Intermediate",
        topic="CASE",
        starter_sql="SELECT LoanID, LoanAmount,\n  CASE\n    WHEN ... THEN 'Small'\n  END AS LoanSize\nFROM Loans;",
        reference_sql="""
            SELECT LoanID, LoanAmount,
                CASE
                    WHEN LoanAmount < 5000 THEN 'Small'
                    WHEN LoanAmount < 15000 THEN 'Medium'
                    ELSE 'Large'
                END AS LoanSize
            FROM Loans;
        """,
        comparison_mode=ComparisonMode.unordered,
    ),
    Challenge(
        id=10,
        title="Branch Performance",
        description="SQLBank management wants to understand branch performance. Calculate the loan application approval rate for each branch and return the five branches with the highest approval rate.",
        difficulty="Intermediate",
        topic="Business Analysis",
        starter_sql="SELECT TOP 5\nFROM Branches b\nJOIN Applications a ON ...",
        reference_sql="""
            SELECT TOP 5
                b.BranchName,
                CAST(SUM(CASE WHEN a.Status = 'Approved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(10,2)) AS ApprovalRate
            FROM Branches b
            INNER JOIN Applications a ON b.BranchID = a.BranchID
            GROUP BY b.BranchName
            ORDER BY ApprovalRate DESC, b.BranchName ASC;
        """,
        comparison_mode=ComparisonMode.ordered,
    ),
]


def list_challenges() -> list[PublicChallenge]:
    return [to_public(challenge) for challenge in _CHALLENGES]


def get_challenge(challenge_id: int) -> Challenge | None:
    return next((challenge for challenge in _CHALLENGES if challenge.id == challenge_id), None)


def to_public(challenge: Challenge) -> PublicChallenge:
    return PublicChallenge(**challenge.model_dump(exclude={"reference_sql", "comparison_mode"}))
