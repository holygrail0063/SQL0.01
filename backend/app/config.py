from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    query_engine: str = "sqlite"
    sqlite_database_path: str = ""
    sql_server_host: str = "localhost"
    sql_server_port: int = 1433
    sql_server_database: str = "SQLBankTraining"
    sql_server_user: str = "sqlbank_learner"
    sql_server_password: str = "ChangeThis_StrongPassword123"
    frontend_origin: str = "http://localhost:3000"
    query_timeout_seconds: int = 5
    max_result_rows: int = 200
    max_query_length: int = 5000

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
