from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import router as api_router
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # тут можно положить health-check БД, warm-up кэша и т.п.
    yield


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router)

base_dir = "/home/bato/fastApiProjects/blog_proj/" # заменить потом через os base dir
app.mount("/static", StaticFiles(directory=f"{base_dir}static"), name="static")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
