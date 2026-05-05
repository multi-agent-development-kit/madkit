"""Verifica que cada key de i18n existe en ES y EN."""
from __future__ import annotations

from madkit.i18n import _STRINGS


def test_es_and_en_have_same_keys() -> None:
    es_keys = set(_STRINGS["ES"].keys())
    en_keys = set(_STRINGS["EN"].keys())
    missing_in_en = es_keys - en_keys
    missing_in_es = en_keys - es_keys
    assert not missing_in_en, f"keys faltan en EN: {missing_in_en}"
    assert not missing_in_es, f"keys faltan en ES: {missing_in_es}"


def test_no_empty_strings() -> None:
    for lang, strings in _STRINGS.items():
        for key, value in strings.items():
            assert value.strip(), f"{lang}/{key} está vacío"
