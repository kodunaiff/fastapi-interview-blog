from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_active_user
from api.pagination import cursor_pagination
from crud import post as crud_post
from models.post import Post
from models.user import User
from schemas.post import PostCreate, PostUpdate, PostRead

router = APIRouter(tags=["posts"], prefix="/posts")


def ensure_owner_or_superuser(current_user: User, post: Post):
    if not (current_user.is_superuser or post.owner_id == current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")


@router.get("/", response_model=list[PostRead])
async def list_posts(session: AsyncSession = Depends(get_db), ):
    posts = await crud_post.get_posts_all(session)
    return posts


@router.get("/cursor", response_model=list[PostRead])
async def list_posts(
    cursor: Optional[UUID] = None,
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    posts = await cursor_pagination(
        session=session,
        model=Post,
        cursor=cursor,
        limit=limit,
        cursor_column=Post.created_at,
        id_column=Post.id
    )
    return posts


@router.get("/me", response_model=list[PostRead])
async def list_my_posts(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    posts = await crud_post.get_posts_me(session=session, user_id=current_user.id)
    return posts


@router.get("/{post_id}", response_model=PostRead)
async def get_post(post_id: UUID, session: AsyncSession = Depends(get_db)):
    post = await crud_post.get_post_with_rels(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = await crud_post.create_post(
        session=session,
        title=payload.title,
        content=payload.content,
        owner_id=current_user.id,
        tag_ids=payload.tag_ids
    )
    return post


@router.patch("/{post_id}", response_model=PostRead)
async def update_post(
    post_id: UUID,
    payload: PostUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Берём пост без связей для проверки прав
    post = await crud_post.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    ensure_owner_or_superuser(current_user, post)

    # Обновляем и возвращаем с отношениями
    return await crud_post.update_post(
        session,
        post,
        title=payload.title,
        content=payload.content,
        tag_ids=payload.tag_ids,
    )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    post = await crud_post.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    ensure_owner_or_superuser(current_user, post)

    await crud_post.delete_post(session, post_id)
