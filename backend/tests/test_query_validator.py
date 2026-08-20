import pytest

from app.services.query_validator import QueryValidationError, validate_read_only_query


def test_valid_select_query():
    assert validate_read_only_query("SELECT * FROM Customers;", 5000) == "SELECT * FROM Customers"


def test_valid_read_only_cte():
    sql = """
    WITH OntarioCustomers AS (
        SELECT * FROM Customers WHERE Province = 'Ontario'
    )
    SELECT * FROM OntarioCustomers;
    """

    assert validate_read_only_query(sql, 5000).startswith("WITH OntarioCustomers")


@pytest.mark.parametrize("sql", ["UPDATE Customers SET Province = 'AB'", "DELETE FROM Customers", "DROP TABLE Customers"])
def test_prohibited_modification_queries(sql):
    with pytest.raises(QueryValidationError):
        validate_read_only_query(sql, 5000)


def test_multi_statement_attack_attempt():
    with pytest.raises(QueryValidationError):
        validate_read_only_query("SELECT * FROM Customers; DROP TABLE Customers;", 5000)


def test_keyword_inside_string_literal_is_allowed():
    assert validate_read_only_query("SELECT 'DROP' AS Word;", 5000) == "SELECT 'DROP' AS Word"
