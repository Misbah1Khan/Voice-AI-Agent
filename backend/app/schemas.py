"""
Pydantic schemas for request validation and response serialization.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from enum import Enum
from typing import Any, Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ── Enums ────────────────────────────────────────────────────────────
class SexEnum(str, Enum):
    male = "Male"
    female = "Female"
    other = "Other"
    decline = "Decline to Answer"


# ── Shared validators ────────────────────────────────────────────────
US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "PR", "VI", "GU", "AS", "MP",
}

PHONE_RE = re.compile(r"^\d{10}$")


def _validate_phone(v: str, field_name: str = "phone_number") -> str:
    digits = re.sub(r"[\s\-\(\)\+]", "", v)
    # Strip leading US country code
    if digits.startswith("1") and len(digits) == 11:
        digits = digits[1:]
    if not PHONE_RE.match(digits):
        raise ValueError(f"{field_name} must be exactly 10 digits")
    return digits


# ── Request schemas ──────────────────────────────────────────────────
class PatientCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    sex: SexEnum
    phone_number: str
    address_line_1: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=2, max_length=2)
    zip_code: str = Field(..., min_length=5, max_length=10)

    # Optional
    email: Optional[EmailStr] = None
    address_line_2: Optional[str] = Field(None, max_length=255)
    insurance_provider: Optional[str] = Field(None, max_length=255)
    insurance_member_id: Optional[str] = Field(None, max_length=100)
    preferred_language: Optional[str] = Field("English", max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = None

    # ── Validators ───────────────────────────────────────────────────
    @field_validator("date_of_birth")
    @classmethod
    def dob_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return _validate_phone(v, "phone_number")

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _validate_phone(v, "emergency_contact_phone")

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str) -> str:
        v = v.upper()
        if v not in US_STATES:
            raise ValueError(f"Invalid US state abbreviation: {v}")
        return v


class PatientUpdate(BaseModel):
    """All fields optional for partial updates."""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    sex: Optional[SexEnum] = None
    phone_number: Optional[str] = None
    address_line_1: Optional[str] = Field(None, min_length=1, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=2)
    zip_code: Optional[str] = Field(None, min_length=5, max_length=10)
    email: Optional[EmailStr] = None
    address_line_2: Optional[str] = Field(None, max_length=255)
    insurance_provider: Optional[str] = Field(None, max_length=255)
    insurance_member_id: Optional[str] = Field(None, max_length=100)
    preferred_language: Optional[str] = Field(None, max_length=50)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = None

    @field_validator("date_of_birth")
    @classmethod
    def dob_not_in_future(cls, v: Optional[date]) -> Optional[date]:
        if v is not None and v > date.today():
            raise ValueError("date_of_birth cannot be in the future")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _validate_phone(v, "phone_number")

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _validate_phone(v, "emergency_contact_phone")

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.upper()
        if v not in US_STATES:
            raise ValueError(f"Invalid US state abbreviation: {v}")
        return v


# ── Response schemas ─────────────────────────────────────────────────
class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: str
    first_name: str
    last_name: str
    date_of_birth: date
    sex: str
    phone_number: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    email: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_member_id: Optional[str] = None
    preferred_language: Optional[str] = "English"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


# ── Envelope ─────────────────────────────────────────────────────────
DataT = TypeVar("DataT")


class Envelope(BaseModel, Generic[DataT]):
    """Standard API response wrapper."""

    data: Optional[DataT] = None
    error: Optional[str] = None
