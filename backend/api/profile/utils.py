import json
import base64

def get_avatar_base64(avatar_data) -> str:
    if avatar_data is None:
        return ""
    if isinstance(avatar_data, str):
        return avatar_data
    if isinstance(avatar_data, memoryview):
        try:
            return base64.b64encode(avatar_data.tobytes()).decode()
        except Exception:
            return ""
    if isinstance(avatar_data, bytes):
        try:
            return base64.b64encode(avatar_data).decode()
        except Exception:
            return ""
    # Для других типов пытаемся преобразовать в байты
    try:
        if hasattr(avatar_data, 'tobytes'):
            return base64.b64encode(avatar_data.tobytes()).decode()
        if hasattr(avatar_data, '__bytes__'):
            return base64.b64encode(bytes(avatar_data)).decode()
    except Exception:
        pass
    return ""


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