"""Interface base para todos los adapters de IDE."""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class IntegrationBase(ABC):
    """Contrato común para adapters claude / cursor / codex.

    Cada adapter sabe cómo desplegar sus templates al proyecto destino y cómo
    reportar features degradados respecto a las primitivas Claude Code-only.
    """

    name: str = ""

    @abstractmethod
    def deploy(self, project_path: Path, *, force: bool = False) -> list[Path]:
        """Despliega el scaffolding del IDE en el proyecto. Devuelve paths creados."""

    @abstractmethod
    def detect(self, project_path: Path) -> bool:
        """¿El proyecto ya tiene scaffolding de este IDE?"""

    @abstractmethod
    def degraded_features(self) -> list[tuple[str, str]]:
        """Pares (feature, mensaje accionable) para features no soportados."""
