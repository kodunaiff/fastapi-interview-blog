from fastapi import APIRouter

from .auth import router as auth_router
from .posts import router as posts_router
from .tags import router as tags_router
from .users import router as users_router
from core.config import settings


router = APIRouter(prefix=settings.API_V1_PREFIX)
router.include_router(auth_router)
router.include_router(posts_router)
router.include_router(tags_router)
router.include_router(users_router)
