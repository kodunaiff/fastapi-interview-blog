from typing import Sequence
from uuid import UUID

import sqlalchemy as sa
from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Post, Tag


def _with_rels(stmt):
    return stmt.options(
        selectinload(Post.owner),
        selectinload(Post.tags),
    )


async def get_tags(session: AsyncSession):
    stmt = select(Tag).order_by(Tag.name.asc())
    return (await session.execute(stmt)).scalars().all()


async def get_tag(
    tag_id: UUID,
    session: AsyncSession
):
    return (await session.execute(select(Tag).where(Tag.id == tag_id))).scalar_one_or_none()


async def create_tag(
    session: AsyncSession,
    *,
    name: str,
) -> Tag:
    exists = (await session.execute(select(Tag).where(Tag.name == name))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="Tag already exists")
    tag = Tag(name=name)
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag


async def update_tag(
    session: AsyncSession,
    tag: Tag,
    *,
    name: str
) -> Tag:
    if name is not None:
        tag.name = name
    await session.commit()
    await session.refresh(tag)
    return tag


async def delete_tag(
    tag_id: UUID,
    session: AsyncSession,
):
    await session.execute(delete(Tag).where(Tag.id == tag_id))
    await session.commit()


# resolve

def _normalize_unique_ordered(names: Sequence[str]) -> list[str]:
    seen = set()
    result: list[str] = []
    for n in names or []:
        if n is None:
            continue
        v = n.strip().lower()  # нормализация: trim + lower
        if not v or v in seen:
            continue
        seen.add(v)
        result.append(v)
    return result


async def resolve_tag_ids(session: AsyncSession, names: Sequence[str]) -> list[UUID]:
    """
    Возвращает список UUID тегов в порядке переданных имён (после нормализации и удаления дублей).
    Отсутствующие теги создаёт.
    """
    norm_names = _normalize_unique_ordered(names)
    if not norm_names:
        return []

    # Вставляем все разом; существующие — игнорируются (без исключений)
    values = [{"name": n} for n in norm_names]
    insert_stmt = (
        pg_insert(Tag.__table__)
        .values(values)
        .on_conflict_do_nothing(index_elements=[Tag.__table__.c.name])
    )
    await session.execute(insert_stmt)

    # Забираем id всех нужных тегов
    rows = await session.execute(
        sa.select(Tag.id, Tag.name).where(Tag.name.in_(norm_names))
    )
    id_by_name = {name: id_ for id_, name in rows.all()}

    # Должны быть все, иначе это ошибка целостности
    ids = [id_by_name[n] for n in norm_names]
    await session.commit()
    return ids
