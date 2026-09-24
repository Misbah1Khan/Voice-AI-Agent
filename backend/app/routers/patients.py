"""
REST API endpoints for Patient CRUD operations.
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..crud import (
    create_patient,
    get_patient,
    get_patients,
    soft_delete_patient,
    update_patient,
)
from ..database import get_db
from ..schemas import (
    Envelope,
    PatientCreate,
    PatientResponse,
    PatientUpdate,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


# ── GET /patients ────────────────────────────────────────────────────
@router.get(
    "",
    response_model=Envelope[List[PatientResponse]],
    status_code=status.HTTP_200_OK,
)
def list_patients(
    last_name: Optional[str] = Query(None),
    date_of_birth: Optional[date] = Query(None),
    phone_number: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    patients = get_patients(
        db,
        last_name=last_name,
        date_of_birth=date_of_birth,
        phone_number=phone_number,
    )
    return Envelope(
        data=[PatientResponse.model_validate(p) for p in patients],
        error=None,
    )


# ── GET /patients/{id} ──────────────────────────────────────────────
@router.get(
    "/{patient_id}",
    response_model=Envelope[PatientResponse],
    status_code=status.HTTP_200_OK,
)
def read_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = get_patient(db, patient_id)
    if not patient or patient.deleted_at is not None:
        return Envelope(data=None, error="Patient not found")
    return Envelope(
        data=PatientResponse.model_validate(patient),
        error=None,
    )


# ── POST /patients ──────────────────────────────────────────────────
@router.post(
    "",
    response_model=Envelope[PatientResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_new_patient(body: PatientCreate, db: Session = Depends(get_db)):
    patient = create_patient(db, body)
    return Envelope(
        data=PatientResponse.model_validate(patient),
        error=None,
    )


# ── PUT /patients/{id} ──────────────────────────────────────────────
@router.put(
    "/{patient_id}",
    response_model=Envelope[PatientResponse],
    status_code=status.HTTP_200_OK,
)
def update_existing_patient(
    patient_id: str,
    body: PatientUpdate,
    db: Session = Depends(get_db),
):
    patient = get_patient(db, patient_id)
    if not patient or patient.deleted_at is not None:
        return Envelope(data=None, error="Patient not found")
    updated = update_patient(db, patient, body)
    return Envelope(
        data=PatientResponse.model_validate(updated),
        error=None,
    )


# ── DELETE /patients/{id} ───────────────────────────────────────────
@router.delete(
    "/{patient_id}",
    response_model=Envelope[PatientResponse],
    status_code=status.HTTP_200_OK,
)
def delete_patient_record(patient_id: str, db: Session = Depends(get_db)):
    patient = get_patient(db, patient_id)
    if not patient or patient.deleted_at is not None:
        return Envelope(data=None, error="Patient not found")
    deleted = soft_delete_patient(db, patient)
    return Envelope(
        data=PatientResponse.model_validate(deleted),
        error=None,
    )
