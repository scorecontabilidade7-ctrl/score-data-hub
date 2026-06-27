from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Sólides API
    solides_token: str = ""
    solides_base_url: str = "https://api.tangerino.com.br"

    # PostgreSQL
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "solides_dw"
    db_user: str = "postgres"
    db_password: str = ""

    @property
    def db_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def solides_headers(self) -> dict:
        return {
            "Authorization": f"Basic {self.solides_token}",
            "Content-Type": "application/json",
        }


settings = Settings()
