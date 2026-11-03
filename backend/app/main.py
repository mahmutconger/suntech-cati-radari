from __future__ import annotations

import importlib
import pkgutil
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import CORS_ORIGINS
from app.core.firebase import get_firestore_client
from app.infrastructure.depo import VeritabaniHatasi

import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        get_firestore_client()
        logger.info("Firebase bağlantısı hazır")
    except Exception as e:
        logger.warning("Firebase bağlanamadı, credentials eksik olabilir: %s", e)
    yield


app = FastAPI(
    title="Çatı Radarı API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def _http_hatasi(_: Request, exc: HTTPException) -> JSONResponse:
    hata = exc.detail if isinstance(exc.detail, dict) else {"kod": "hata", "mesaj": str(exc.detail)}
    return JSONResponse({"hata": hata}, status_code=exc.status_code, headers=exc.headers)


@app.exception_handler(VeritabaniHatasi)
async def _veritabani_hatasi(_: Request, exc: VeritabaniHatasi) -> JSONResponse:
    logger.error("Firestore okunamadı: %s", exc.__cause__)
    return JSONResponse({"hata": {"kod": "veritabani", "mesaj": "Veritabanına ulaşılamadı"}}, status_code=503)


@app.exception_handler(RequestValidationError)
async def _dogrulama_hatasi(_: Request, exc: RequestValidationError) -> JSONResponse:
    ilk = exc.errors()[0]
    alan = ".".join(str(p) for p in ilk["loc"][1:])
    return JSONResponse({"hata": {"kod": "gecersiz_istek", "mesaj": f"{alan}: {ilk['msg']}"}}, status_code=422)


def _register_routers() -> None:
    package = importlib.import_module("app.api.v1")
    prefix = "/api/v1"
    for info in pkgutil.iter_modules(package.__path__):
        if info.name.startswith("_"):
            continue
        module = importlib.import_module(f"app.api.v1.{info.name}")
        router = getattr(module, "router", None)
        if router is not None:
            app.include_router(router, prefix=prefix)


_register_routers()


@app.get("/api/v1/saglik")
async def saglik():
    return {"durum": "tamam"}
