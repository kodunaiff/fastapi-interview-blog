from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)


class UserRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        #populate_by_name=True,  # ← важно!
        #alias_generator=to_camel
    )

    id: UUID
    username: str
    email: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime