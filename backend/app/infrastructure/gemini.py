from __future__ import annotations

import logging

from google import genai
from google.genai import errors, types

from app.core.config import GEMINI_API_KEY, GEMINI_MODELLER

logger = logging.getLogger(__name__)

_client: genai.Client | None = None


class GeminiHatasi(Exception):
    pass


def _istemci() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY, http_options=types.HttpOptions(timeout=30_000))
    return _client


def uret(icerik: list[types.Content], config: types.GenerateContentConfig) -> tuple[types.GenerateContentResponse, str]:
    """Modelleri sırayla dener; yoğunluk ya da kota hatasında sıradakine geçer."""
    for model in GEMINI_MODELLER:
        try:
            return _istemci().models.generate_content(model=model, contents=icerik, config=config), model
        except errors.APIError as e:
            if e.code not in (429, 500, 503, 504):
                raise GeminiHatasi(f"{model}: {e.code}") from e
            logger.warning("Gemini %s %s, sıradaki modele geçiliyor", model, e.code)
        except Exception as e:  # zaman aşımı, bağlantı kopması
            logger.warning("Gemini %s ulaşılamadı: %s", model, e)
    raise GeminiHatasi("bütün modeller meşgul")
