from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_superuser, get_current_active_user
from models.post import Tag
from schemas.tag import TagCreate, TagRead, TagResolveRequest, TagIDs, TagWithPosts

router = APIRouter(tags=["tags"], prefix="/tags")


@router.get("/", response_model=list[TagRead])
async def list_tags(
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Tag).order_by(Tag.name.asc())
    tags = (await session.execute(stmt)).scalars().all()
    return tags


@router.get("/{tag_id}", response_model=TagWithPosts)
async def get_tag(
    tag_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_active_user),
):
    tag = (await session.execute(select(Tag).where(Tag.id == tag_id))).scalar_one_or_none()
    return tag


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


@router.post("/resolve", response_model=TagIDs)
async def resolve_tags(
    payload: TagResolveRequest,
    session: AsyncSession = Depends(get_db),
    _user=Depends(get_current_active_user),  # только авторизованным
):
    # нормализуем и убираем дубли, сохраняя порядок
    names = list(dict.fromkeys(n.strip() for n in payload.names if n.strip()))
    if not names:
        return TagIDs(ids=[])

    # существующие теги
    existing = (await session.execute(select(Tag).where(Tag.name.in_(names)))).scalars().all()
    by_name = {t.name: t for t in existing}

    # создать недостающие
    to_create = [name for name in names if name not in by_name]
    new_tags = []
    for name in to_create:
        t = Tag(name=name)
        session.add(t)
        new_tags.append(t)

    if new_tags:
        # получим UUID сразу, не дожидаясь commit
        await session.flush()

    for t in new_tags:
        by_name[t.name] = t

    await session.commit()

    ids: List[UUID] = [by_name[name].id for name in names]
    return TagIDs(ids=ids)
