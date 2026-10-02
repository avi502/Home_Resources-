from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from backend.app.db.session import Base


class TimestampMixin:
    """Provides UTC created_at and updated_at timestamps."""
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
