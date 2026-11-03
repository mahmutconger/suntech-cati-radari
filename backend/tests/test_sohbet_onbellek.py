"""Asistan cevap önbelleği: aynı soru Gemini'ye gitmemeli, veri değişince temizlenmeli."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

import pytest

from app.application import sohbet


def _sahte_uret(icerik, config):
    """Tek turda metin dönen sahte Gemini."""
    parca = SimpleNamespace(text="Test cevabı", thought=False, function_call=None)
    aday = SimpleNamespace(content=SimpleNamespace(parts=[parca]))
    yanit = SimpleNamespace(candidates=[aday], function_calls=None)
    return yanit, "sahte-model"


@pytest.fixture(autouse=True)
def _temiz():
    sohbet._cevaplar.clear()
    yield
    sohbet._cevaplar.clear()


@patch("app.application.sohbet.GEMINI_SAHTE", False)
@patch("app.application.sohbet.uret", _sahte_uret)
def test_ayni_soru_onbellekten_gelir():
    mesajlar = [{"rol": "kullanici", "metin": "en iyi 3 çatı?"}]
    ilk = sohbet.cevapla(mesajlar)
    assert ilk["cevap"] == "Test cevabı"

    # ikinci çağrı uret'e gitmemeli
    with patch("app.application.sohbet.uret", side_effect=AssertionError("Gemini çağrılmamalı")):
        ikinci = sohbet.cevapla(mesajlar)
    assert ikinci is ilk  # aynı nesne


@patch("app.application.sohbet.GEMINI_SAHTE", False)
@patch("app.application.sohbet.uret", _sahte_uret)
def test_cevaplari_unut_temizler():
    sohbet.cevapla([{"rol": "kullanici", "metin": "test"}])
    assert len(sohbet._cevaplar) == 1
    sohbet.cevaplari_unut()
    assert len(sohbet._cevaplar) == 0


@patch("app.application.sohbet.GEMINI_SAHTE", False)
@patch("app.application.sohbet.uret", _sahte_uret)
def test_onbellek_tasinca_temizlenir():
    for i in range(sohbet.AZAMI_ONBELLEK + 1):
        sohbet.cevapla([{"rol": "kullanici", "metin": f"soru {i}"}])
    assert len(sohbet._cevaplar) == 1  # taştı, temizlendi, sadece son kaldı
