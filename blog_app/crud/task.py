from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Task


# async def get_tasks(session: AsyncSession):
#     stmt = select(Task).order_by(Task.title.asc())
#     return (await session.execute(stmt)).scalars().all()

async def get_tasks(session: AsyncSession):
    stmt = (
        select(Task)
        .options(selectinload(Task.owner))  # подгружаем owner заранее
        .order_by(Task.title.asc())
    )
    return (await session.execute(stmt)).scalars().all()

async def get_task(
    task_id: UUID,
    session: AsyncSession
) -> Task:
    return (await session.execute(select(Task).where(Task.id == task_id))).scalar_one_or_none()


async def create_task(
    session: AsyncSession,
    *,
    title: str,
    description: str | None,
    owner_id: UUID,
) -> Task:
    task = Task(
        title=title,
        description=description,
        owner_id=owner_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task
