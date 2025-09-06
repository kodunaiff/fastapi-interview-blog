from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_active_user
from crud import task as crud_task
from models import User
from schemas.task import TaskCreate, TaskRead

router = APIRouter(tags=["tasks"], prefix="/tasks")


@router.get("/", response_model=list[TaskRead])
async def list_tasks(session: AsyncSession = Depends(get_db), ):
    tasks = await crud_task.get_tasks(session)
    return tasks


@router.get("/{task_id}", response_model=TaskRead)
async def get_task(task_id: UUID, session: AsyncSession = Depends(get_db)):
    task = await crud_task.get_task(task_id, session)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = await crud_task.create_task(
        session=session,
        title=payload.title,
        description=payload.description,
        owner_id=current_user.id,
    )
    return task
