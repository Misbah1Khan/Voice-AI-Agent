"""
CRUD operations for the Patient model.
"""
from datetime import date, datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from . import models, schemas


def get_patients(
    db: Session,
    *,
    last_name: Optional[str] = None,
    date_of_birth: Optional[date] = None,
    phone_number: Optional[str] = None,
) -> list[models.Patient]:
    """Return all non-deleted patients, with optional filters."""
    query = db.query(models.Patient).filter(models.Patient.deleted_at.is_(None))

    if last_name:
        query = query.filter(
            models.Patient.last_name.ilike(f"%{last_name}%")
        )
    if date_of_birth:
        query = query.filter(models.Patient.date_of_birth == date_of_birth)
    if phone_number:
        query = query.filter(models.Patient.phone_number == phone_number)

    return query.order_by(models.Patient.created_at.desc()).all()


def get_patient(db: Session, patient_id: str) -> Optional[models.Patient]:
    """Return a single patient by ID (even if soft-deleted, for admin)."""
    return (
        db.query(models.Patient)
        .filter(models.Patient.patient_id == patient_id)
        .first()
    )


def create_patient(db: Session, data: schemas.PatientCreate) -> models.Patient:
    """Insert a new patient record."""
    now = datetime.now(timezone.utc)
    patient = models.Patient(
        patient_id=str(uuid4()),
        first_name=data.first_name,
        last_name=data.last_name,
        date_of_birth=data.date_of_birth,
        sex=data.sex.value,
        phone_number=data.phone_number,
        address_line_1=data.address_line_1,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        email=data.email,
        address_line_2=data.address_line_2,
        insurance_provider=data.insurance_provider,
        insurance_member_id=data.insurance_member_id,
        preferred_language=data.preferred_language or "English",
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_phone=data.emergency_contact_phone,
        created_at=now,
        updated_at=now,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def update_patient(
    db: Session,
    patient: models.Patient,
    data: schemas.PatientUpdate,
) -> models.Patient:
    """Partially update a patient record."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "sex" and value is not None:
            value = value.value if isinstance(value, schemas.SexEnum) else value
        setattr(patient, field, value)
    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return patient


def soft_delete_patient(db: Session, patient: models.Patient) -> models.Patient:
    """Soft-delete by setting deleted_at timestamp."""
    patient.deleted_at = datetime.now(timezone.utc)
    patient.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(patient)
    return patient
