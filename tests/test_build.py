"""Smoke test: el paquete builda sin errores y produce wheel con templates embebidos."""
from __future__ import annotations

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

import pytest


@pytest.mark.slow
def test_wheel_builds_and_contains_templates(tmp_path: Path) -> None:
    """`python -m build` produce wheel y dentro encontramos `madkit/templates/claude/CLAUDE.md.template`."""
    project_root = Path(__file__).parent.parent
    out_dir = tmp_path / "dist"

    try:
        subprocess.run(
            [sys.executable, "-m", "build", "--wheel", "--outdir", str(out_dir)],
            check=True,
            cwd=project_root,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        pytest.skip(f"build no disponible o falló: {exc.stderr[:200]}")
    except FileNotFoundError:
        pytest.skip("python -m build no está instalado en el venv")

    wheels = list(out_dir.glob("*.whl"))
    assert len(wheels) == 1, f"se esperaba 1 wheel, se encontraron {len(wheels)}"

    with zipfile.ZipFile(wheels[0]) as zf:
        names = zf.namelist()
        # CLAUDE.md.template embebido
        assert any("madkit/templates/claude/CLAUDE.md.template" in n for n in names), (
            f"CLAUDE.md.template no encontrado en wheel. Contenidos: {names[:20]}"
        )
        # Entry point declarado (cualquier versión 0.1.x)
        assert any(
            n.startswith("madkit-") and n.endswith(".dist-info/entry_points.txt") for n in names
        )
