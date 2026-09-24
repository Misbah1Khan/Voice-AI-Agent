"""
SQLAlchemy ORM model for the Patient table.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Date, DateTime, Enum as SAEnum
from sqlalchemy.dialects.sqlite import CHAR

from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(
        CHAR(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )

    # ── Required fields ──────────────────────────────────────────────
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    sex = Column(
        SAEnum("Male", "Female", "Other", "Decline to Answer", name="sex_enum"),
        nullable=False,
    )
    phone_number = Column(String(10), nullable=False)  # 10-digit US number
    address_line_1 = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(2), nullable=False)  # 2-letter abbreviation
    zip_code = Column(String(10), nullable=False)

    # ── Optional fields ──────────────────────────────────────────────
    email = Column(String(255), nullable=True)
    address_line_2 = Column(String(255), nullable=True)
    insurance_provider = Column(String(255), nullable=True)
    insurance_member_id = Column(String(100), nullable=True)
    preferred_language = Column(String(50), default="English")
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(10), nullable=True)

    # ── Timestamps ───────────────────────────────────────────────────
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # soft-delete

    def __repr__(self) -> str:
        return (
            f"<Patient(patient_id={self.patient_id!r}, "
            f"name={self.first_name!r} {self.last_name!r})>"
        )
