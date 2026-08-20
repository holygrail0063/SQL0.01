SCHEMA = [
    {
        "table": "Customers",
        "columns": [
            {"name": "CustomerID", "type": "int"},
            {"name": "FirstName", "type": "nvarchar(50)"},
            {"name": "LastName", "type": "nvarchar(50)"},
            {"name": "Province", "type": "nvarchar(50)"},
            {"name": "City", "type": "nvarchar(80)"},
            {"name": "DateOfBirth", "type": "date"},
            {"name": "CustomerSince", "type": "date"},
        ],
    },
    {
        "table": "Branches",
        "columns": [
            {"name": "BranchID", "type": "int"},
            {"name": "BranchName", "type": "nvarchar(100)"},
            {"name": "Province", "type": "nvarchar(50)"},
            {"name": "City", "type": "nvarchar(80)"},
        ],
    },
    {
        "table": "Applications",
        "columns": [
            {"name": "ApplicationID", "type": "int"},
            {"name": "CustomerID", "type": "int"},
            {"name": "BranchID", "type": "int"},
            {"name": "ApplicationDate", "type": "date"},
            {"name": "RequestedAmount", "type": "decimal(12,2)"},
            {"name": "Status", "type": "nvarchar(20)"},
            {"name": "RiskScore", "type": "int"},
        ],
    },
    {
        "table": "Loans",
        "columns": [
            {"name": "LoanID", "type": "int"},
            {"name": "CustomerID", "type": "int"},
            {"name": "BranchID", "type": "int"},
            {"name": "LoanAmount", "type": "decimal(12,2)"},
            {"name": "InterestRate", "type": "decimal(5,2)"},
            {"name": "StartDate", "type": "date"},
            {"name": "LoanStatus", "type": "nvarchar(20)"},
        ],
    },
    {
        "table": "Payments",
        "columns": [
            {"name": "PaymentID", "type": "int"},
            {"name": "LoanID", "type": "int"},
            {"name": "PaymentDate", "type": "date"},
            {"name": "Amount", "type": "decimal(12,2)"},
            {"name": "PaymentStatus", "type": "nvarchar(20)"},
        ],
    },
]


def get_public_schema() -> list[dict[str, object]]:
    return SCHEMA
