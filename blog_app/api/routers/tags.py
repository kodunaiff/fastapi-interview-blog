from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from api.dependencies import get_db, get_current_superuser
from models.post import Tag
from schemas.tag import TagCreate, TagRead

router = APIRouter(tags=["tags"], prefix="/tags")

@router.get("/", response_model=list[TagRead])
async def list_tags(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Tag).limit(limit).offset(offset).order_by(Tag.name.asc())
    tags = (await session.execute(stmt)).scalars().all()
    return tags

@router.post("/", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_superuser),
):
    exists = (await session.execute(select(Tag).where(Tag.name == payload.name))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Tag already exists")
    tag = Tag(name=payload.name)
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_superuser),
):
    res = await session.execute(delete(Tag).where(Tag.id == tag_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    await session.commit()