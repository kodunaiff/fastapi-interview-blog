from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.dependencies import get_db, get_current_active_user
from models.post import Post, Tag
from models.user import User
from schemas.post import PostCreate, PostUpdate, PostRead

router = APIRouter(tags=["posts"], prefix="/posts")


@router.get("/", response_model=list[PostRead])
async def list_posts(
    session: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Post)
        .options(
            selectinload(Post.owner),
            selectinload(Post.tags),
        )
        .order_by(Post.created_at.desc())
    )
    posts = (await session.execute(stmt)).scalars().all()
    return posts



@router.get("/me", response_model=list[PostRead])
async def list_posts(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = (
        select(Post)
        .options(
            selectinload(Post.owner),
            selectinload(Post.tags),
        )
        .where(Post.owner_id==current_user.id)
        .order_by(Post.created_at.desc())
    )
    posts = (await session.execute(stmt)).scalars().all()
    return posts

@router.get("/{post_id}", response_model=PostRead)
async def get_post(post_id: UUID, session: AsyncSession = Depends(get_db)):
    post = (await session.execute(
        select(Post).where(Post.id == post_id)
    )).scalar_one_or_none()
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
