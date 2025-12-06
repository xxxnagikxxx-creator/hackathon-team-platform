import base64
import binascii


def decode_pic_base64(pic_str: str | None) -> bytes | None:
    if not pic_str or not pic_str.strip():
        return None
    try:
        pic_cleaned = pic_str.strip()
        if ',' in pic_cleaned:
            pic_cleaned = pic_cleaned.split(',')[-1]
        valid_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
        if not all(c in valid_chars for c in pic_cleaned):
            return None
        missing_padding = len(pic_cleaned) % 4
        if missing_padding:
            pic_cleaned += '=' * (4 - missing_padding)
        pic_bytes = base64.b64decode(pic_cleaned, validate=True)
        return pic_bytes
        
    except (ValueError, TypeError, binascii.Error, Exception):
        return None


def get_pic_base64(pic_data) -> str:
    if pic_data is None:
        return ""
    if isinstance(pic_data, str):
        return pic_data
    if isinstance(pic_data, memoryview):
        try:
            return base64.b64encode(pic_data.tobytes()).decode()
        except Exception:
            return ""
    if isinstance(pic_data, bytes):
        try:
            return base64.b64encode(pic_data).decode()
        except Exception:
            return ""
    try:
        if hasattr(pic_data, 'tobytes'):
            return base64.b64encode(pic_data.tobytes()).decode()
        if hasattr(pic_data, '__bytes__'):
            return base64.b64encode(bytes(pic_data)).decode()
        return ""
    except Exception:
        return ""