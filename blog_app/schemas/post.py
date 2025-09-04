from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict

#from schemas.tag import TagRead
from schemas.user import UserRead
from schemas.common import TagBrief


class PostBase(BaseModel):
    title: str
    content: str


class PostCreate(PostBase):
    tag_ids: Optional[list[UUID]] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tag_ids: Optional[list[UUID]] = None


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    content: str
    owner: UserRead
    #tags: list[TagRead]
    tags: List[TagBrief]
    created_at: datetime
    updated_at: Optional[datetime] = None