import re


PROHIBITED_KEYWORDS = {
    "ALTER",
    "BACKUP",
    "CREATE",
    "DBCC",
    "DELETE",
    "DROP",
    "EXEC",
    "EXECUTE",
    "GRANT",
    "INSERT",
    "MERGE",
    "RESTORE",
    "REVOKE",
    "TRUNCATE",
    "UPDATE",
    "USE",
}


class QueryValidationError(ValueError):
    pass


def validate_read_only_query(query: str, max_length: int) -> str:
    stripped = query.strip()
    if not stripped:
        raise QueryValidationError("Enter a SQL query before running it.")
    if len(stripped) > max_length:
        raise QueryValidationError(f"Query is too long. Keep it under {max_length} characters.")

    without_comments = _strip_comments(stripped)
    if _has_multiple_statements(without_comments):
        raise QueryValidationError("Only one read-only SQL statement can be executed at a time.")

    first_keyword = _first_keyword(without_comments)
    if first_keyword not in {"SELECT", "WITH"}:
        raise QueryValidationError("Only SELECT queries and read-only CTE queries are allowed.")

    tokens = set(re.findall(r"\b[A-Za-z_][A-Za-z0-9_]*\b", _strip_string_literals(without_comments).upper()))
    blocked = sorted(PROHIBITED_KEYWORDS.intersection(tokens))
    if blocked:
        raise QueryValidationError(f"Prohibited SQL keyword detected: {blocked[0]}.")

    return stripped.rstrip(";")


def _first_keyword(sql: str) -> str | None:
    match = re.search(r"\b[A-Za-z_][A-Za-z0-9_]*\b", sql)
    return match.group(0).upper() if match else None


def _strip_comments(sql: str) -> str:
    result: list[str] = []
    i = 0
    in_single = False
    in_double = False
    while i < len(sql):
        char = sql[i]
        nxt = sql[i + 1] if i + 1 < len(sql) else ""
        if char == "'" and not in_double:
            in_single = not in_single
            result.append(char)
            i += 1
            continue
        if char == '"' and not in_single:
            in_double = not in_double
            result.append(char)
            i += 1
            continue
        if not in_single and not in_double and char == "-" and nxt == "-":
            i = sql.find("\n", i)
            if i == -1:
                break
            result.append("\n")
            continue
        if not in_single and not in_double and char == "/" and nxt == "*":
            end = sql.find("*/", i + 2)
            i = len(sql) if end == -1 else end + 2
            result.append(" ")
            continue
        result.append(char)
        i += 1
    return "".join(result)


def _strip_string_literals(sql: str) -> str:
    return re.sub(r"'(?:''|[^'])*'|\"(?:\"\"|[^\"])*\"", "''", sql)


def _has_multiple_statements(sql: str) -> bool:
    in_single = False
    in_double = False
    semicolons = 0
    for index, char in enumerate(sql):
        if char == "'" and not in_double:
            in_single = not in_single
        elif char == '"' and not in_single:
            in_double = not in_double
        elif char == ";" and not in_single and not in_double:
            if sql[index + 1 :].strip():
                semicolons += 1
    return semicolons > 0
