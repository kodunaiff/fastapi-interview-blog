from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_active_user
from models.post import Post, Tag
from models.user import User
from schemas.post import PostCreate, PostUpdate, PostRead

router = APIRouter(tags=["posts"], prefix="/posts")


@router.get("/", response_model=list[PostRead])
async def list_posts(
    session: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tag_id: Optional[UUID] = Query(default=None),
    owner_id: Optional[UUID] = Query(default=None),
    q: Optional[str] = Query(default=None, description="Search in title"),
):
    stmt = select(Post).order_by(Post.created_at.desc()).limit(limit).offset(offset)
    if tag_id:
        stmt = stmt.join(Post.tags).where(Tag.id == tag_id)
    if owner_id:
        stmt = stmt.where(Post.owner_id == owner_id)
    if q:
        stmt = stmt.where(Post.title.ilike(f"%{q}%"))

    posts = (await session.execute(stmt)).scalars().unique().all()
    return posts


@router.get("/{post_id}", response_model=PostRead)
async def get_post(post_id: UUID, session: AsyncSession = Depends(get_db)):
    post = (await session.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tags: list[Tag] = []
    if payload.tag_ids:
        tags = (await session.execute(select(Tag).where(Tag.id.in_(payload.tag_ids)))).scalars().all()

    post = Post(
        title=payload.title,
        content=payload.content,
        owner_id=current_user.id,
        tags=tags,
    )
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return post


def ensure_owner_or_superuser(current_user: User, post: Post):
    if not (current_user.is_superuser or post.owner_id == current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


@router.patch("/{post_id}", response_model=PostRead)
async def update_post(
    post_id: UUID,
    payload: PostUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = (await session.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    ensure_owner_or_superuser(current_user, post)

    if payload.title is not None:
        post.title = payload.title
    if payload.content is not None:
        post.content = payload.content
    if payload.tag_ids is not None:
        tags = (await session.execute(select(Tag).where(Tag.id.in_(payload.tag_ids)))).scalars().all()
        post.tags = tags

    await session.commit()
    await session.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = (await session.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    ensure_owner_or_superuser(current_user, post)

    await session.execute(delete(Post).where(Post.id == post_id))
    await session.commit()
