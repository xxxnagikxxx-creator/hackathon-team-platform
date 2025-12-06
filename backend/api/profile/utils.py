import json

def get_avatar_base64(avatar_data: str | None) -> str:
    return avatar_data if avatar_data else ""


def parse_tags(tags: str | list[str] | None) -> list[str]:
    if not tags:
        return []
    if isinstance(tags, list):
        return tags
    if isinstance(tags, str):
        try:
            parsed = json.loads(tags)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []


def serialize_tags(tags: list[str] | None) -> str | None:
    if tags is None:
        return None
    return json.dumps(tags) if tags else None