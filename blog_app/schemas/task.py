from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from models import TaskStatus
from schemas.user import UserRead


class TaskBase(BaseModel):
    title: str
    description: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    status: TaskStatus
    owner: UserRead
    created_at: datetime
    updated_at: datetime | None
