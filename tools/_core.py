"""Load the pure-Python core without importing Home Assistant.

``custom_components/sunspots/__init__.py`` imports Home Assistant, so the tools load
``core/`` as a standalone package called ``sunspots_core``.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

CORE_DIR = Path(__file__).resolve().parents[1] / "custom_components" / "sunspots" / "core"


def load_core() -> None:
    if "sunspots_core" in sys.modules:
        return
    spec = importlib.util.spec_from_file_location(
        "sunspots_core", CORE_DIR / "__init__.py", submodule_search_locations=[str(CORE_DIR)]
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["sunspots_core"] = module
    spec.loader.exec_module(module)
