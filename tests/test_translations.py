"""en/de translations stay in sync with strings.json and the code's translation keys."""

import json
import re
from pathlib import Path

import yaml

BASE = Path(__file__).parents[1] / "custom_components" / "sunspots"
PLACEHOLDER = re.compile(r"\{(\w+)\}")


def flatten(node, prefix=""):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from flatten(value, f"{prefix}{key}.")
    else:
        yield prefix.rstrip("."), node


def load(name):
    return dict(flatten(json.loads((BASE / name).read_text())))


def test_en_equals_strings_json():
    assert load("translations/en.json") == load("strings.json")


def test_de_has_same_keys_and_placeholders():
    en, de = load("strings.json"), load("translations/de.json")
    assert set(en) == set(de)
    for key, text in en.items():
        assert set(PLACEHOLDER.findall(text)) == set(PLACEHOLDER.findall(de[key])), key
        assert de[key].strip(), key


def test_every_service_and_field_is_translated():
    services = yaml.safe_load((BASE / "services.yaml").read_text())
    strings = json.loads((BASE / "strings.json").read_text())["services"]
    for name, spec in services.items():
        assert name in strings
        for field in spec.get("fields", {}):
            assert field in strings[name]["fields"], (name, field)


def test_translation_keys_used_in_code_exist():
    strings = load("strings.json")
    code = "\n".join(p.read_text() for p in BASE.glob("*.py"))
    for key in re.findall(r'translation_key="(\w+)"', code):
        assert any(k.startswith(f"exceptions.{key}.") for k in strings), key
    entity_keys = {k.split(".")[2] for k in strings if k.startswith("entity.")}
    for key in re.findall(
        r'(?:super\(\).__init__\(coordinator, "|_attr_translation_key = ")(\w+)', code
    ):
        assert key in entity_keys, key
