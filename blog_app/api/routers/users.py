from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_db, get_current_superuser
from models.user import User
from schemas.user import UserRead

router = APIRouter(tags=["users"], prefix="/users")

@router.get("/", response_model=list[UserRead])
async def list_users(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    stmt = select(User).limit(limit).offset(offset).order_by(User.created_at.desc())
    users = (await session.execute(stmt)).scalars().all()
    return users

@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    res = await session.execute(delete(User).where(User.id == user_id))
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await session.commit()