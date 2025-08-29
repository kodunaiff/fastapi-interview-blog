from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


class TagCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def normalize(cls, v: str):
        v = v.strip().lower()
        if not v:
            raise ValueError("Tag name must not be empty")
        return v


class TagRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class TagResolveRequest(BaseModel):
    names: list[str]


class TagIDs(BaseModel):
    ids: list[UUID]
