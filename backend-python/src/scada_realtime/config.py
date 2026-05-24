"""Configuración cargada desde variables de entorno."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    db_host: str = Field(default="127.0.0.1")
    db_port: int = Field(default=5501)
    db_name: str = Field(default="scada_minev1")
    db_user: str = Field(default="sigemsa")
    db_password: str = Field(default="sigemsa")

    # WebSocket
    ws_host: str = Field(default="0.0.0.0")
    ws_port: int = Field(default=8765)

    # Simulator
    simulator_truck_count: int = Field(default=10)
    simulator_tick_seconds: int = Field(default=5)
    simulator_speed_multiplier: float = Field(default=1.0)
    geojson_path: Path = Field(default=Path("data/rutas-mina.geojson"))

    # Logging
    log_level: str = Field(default="INFO")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


settings = Settings()
