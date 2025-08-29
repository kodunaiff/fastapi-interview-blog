from fastapi import APIRouter

from core.config import settings
from .routers import router as router_api

router = APIRouter()
router.include_router(
    router_api,
)
