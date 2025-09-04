from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TagBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str


class PostBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    created_at: datetime
