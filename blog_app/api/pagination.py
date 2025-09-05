from typing import Optional
from uuid import UUID

from sqlalchemy import Column, desc
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Post


async def cursor_pagination(
    session: AsyncSession,
    model: type,
    cursor: Optional[UUID] = None,
    limit: int = 20,
    cursor_column: Column = Post.created_at,
    id_column: Column = Post.id
):
    # Добавляем загрузку отношений
    query = select(model).options(
        selectinload(Post.owner),  # ← Загружаем владельца
        selectinload(Post.tags)  # ← Загружаем теги
    ).order_by(desc(cursor_column), desc(id_column))

    if cursor:
        cursor_obj = await session.get(model, cursor)
        if cursor_obj:
            cursor_value = getattr(cursor_obj, cursor_column.name)
            cursor_id = getattr(cursor_obj, id_column.name)

            query = query.where(
                (cursor_column < cursor_value) |
                ((cursor_column == cursor_value) & (id_column < cursor_id))
            )

    return (await session.execute(query.limit(limit))).scalars().all()
