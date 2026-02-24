from fastapi import APIRouter

from app.api.v1.endpoints import analysis, climbs

router = APIRouter()
router.include_router(climbs.router)
router.include_router(analysis.router)
