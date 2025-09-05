from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_active_user, get_current_superuser
from crud import tags as crud_tag
from schemas.tag import TagCreate, TagRead, TagResolveRequest, TagIDs, TagWithPosts, TagUpdate

router = APIRouter(tags=["tags"], prefix="/tags")


@router.get("/", response_model=list[TagRead])
async def list_tags(session: AsyncSession = Depends(get_db)):
    tags = await crud_tag.get_tags(session)
    return tags


@router.get("/{tag_id}", response_model=TagWithPosts)
async def get_tag(
    tag_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_active_user),
):
    tag = await crud_tag.get_tag(session=session, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_active_user),
):
    tag = await crud_tag.create_tag(session=session, name=payload.name)
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: UUID,
    payload: TagUpdate,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_superuser),
):
    tag = await crud_tag.get_tag(tag_id, session)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    return await crud_tag.update_tag(
        session,
        tag,
        name=payload.name,
    )


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: None = Depends(get_current_superuser),
):
    tag = await crud_tag.get_tag(tag_id, session)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    await crud_tag.delete_tag(tag_id, session)


@router.post("/resolve", response_model=TagIDs)
async def resolve_tags(
    payload: TagResolveRequest,
    session: AsyncSession = Depends(get_db),
    _user=Depends(get_current_active_user),  # только авторизованным
):
    ids: List[UUID] = await crud_tag.resolve_tag_ids(session, payload.names)
    return TagIDs(ids=ids)
