from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Post, Tag


def _with_rels(stmt):
    return stmt.options(
        selectinload(Post.owner),
        selectinload(Post.tags),
    )


async def _get_tags_by_ids(session: AsyncSession, tag_ids: Sequence[UUID]) -> list[Tag]:
    return (await session.execute(select(Tag).where(Tag.id.in_(tag_ids)))).scalars().all()


# Получение одного поста без связей (для проверок/прав)
async def get_post(session: AsyncSession, post_id: UUID) -> Optional[Post]:
    stmt = select(Post).where(Post.id == post_id)
    return (await session.execute(stmt)).scalar_one_or_none()


# Получение одного поста с подгруженными связями (для ответа)
async def get_post_with_rels(session: AsyncSession, post_id: UUID) -> Optional[Post]:
    stmt = _with_rels(select(Post).where(Post.id == post_id))
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_posts_all(session: AsyncSession) -> list[Post]:
    stmt = _with_rels(select(Post)).order_by(Post.created_at.desc())
    return (await session.execute(stmt)).scalars().all()


async def get_posts_me(session: AsyncSession, user_id: UUID) -> list[Post]:
    stmt = (
        _with_rels(select(Post))
        .where(Post.owner_id == user_id)
        .order_by(Post.created_at.desc())
    )
    return (await session.execute(stmt)).scalars().all()


# Создание поста (возвращаем уже с подгруженными связями)
async def create_post(
    session: AsyncSession,
    *,
    title: str,
    content: str,
    owner_id: UUID,
    tag_ids: Optional[Sequence[UUID]] = None,
) -> Post:
    tags: list[Tag] = []
    if tag_ids:
        tags = await _get_tags_by_ids(session, tag_ids)

    post = Post(
        title=title,
        content=content,
        owner_id=owner_id,
        tags=tags
    )
    session.add(post)
    await session.commit()
    # Возвращаем с отношениями
    return await get_post_with_rels(session, post.id)


# Обновление поста (на вход — уже загруженный Post без связей)
async def update_post(
    session: AsyncSession,
    post: Post,
    *,
    title: Optional[str] = None,
    content: Optional[str] = None,
    tag_ids: Optional[Sequence[UUID]] = None
) -> Post:
    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
    if tag_ids is not None:
        post.tags = await _get_tags_by_ids(session, tag_ids)

    await session.commit()
    return await get_post_with_rels(session, post.id)


async def delete_post(
    session: AsyncSession,
    post_id: UUID,
):
    await session.execute(delete(Post).where(Post.id == post_id))
    await session.commit()
