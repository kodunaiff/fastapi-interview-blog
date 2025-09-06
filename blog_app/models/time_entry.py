from __future__ import annotations

from datetime import datetime
from uuid import uuid4, UUID

import sqlalchemy as sa
from sqlalchemy import Text, DateTime, CheckConstraint, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)

    task_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task: Mapped["Task"] = relationship(back_populates="time_entries", passive_deletes=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user: Mapped["User"] = relationship(back_populates="time_entries", passive_deletes=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        # лайфхак под naming_convention: имя только "interval", чтобы получилось ck_time_entries_interval
        CheckConstraint("ended_at IS NULL OR ended_at > started_at", name="interval"),
        # Один активный таймер на пользователя (глобально).
        Index(
            "uq_time_entries_user_task_running",
            "user_id",
            "task_id",
            unique=True,
            postgresql_where=sa.text("ended_at IS NULL"),
        ),
    )

    @property
    def duration_seconds(self) -> int | None:
        if self.ended_at is None:
            return None
        return int((self.ended_at - self.started_at).total_seconds())
