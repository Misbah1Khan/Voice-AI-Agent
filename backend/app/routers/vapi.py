"""
Vapi Voice AI webhook endpoint.

Vapi sends tool-call requests as POST payloads. This router receives those
requests and maps them to CRUD operations on the Patient model.

Vapi webhook payload structure for tool calls:
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "call_xxx",
        "type": "function",
        "function": {
          "name": "create_patient" | "get_patient" | "search_patients",
          "arguments": { ... }
        }
      }
    ]
  }
}

We respond with a list of tool-call results:
{
  "results": [
    {
      "toolCallId": "call_xxx",
      "result": "..."
    }
  ]
}
"""
import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..crud import create_patient, get_patient, get_patients
from ..database import get_db
from ..schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/vapi", tags=["Vapi Webhook"])


def _patient_to_str(patient) -> str:
    """Convert a patient ORM object to a readable string for the voice agent."""
    p = PatientResponse.model_validate(patient)
    return (
        f"Patient {p.first_name} {p.last_name}, "
        f"DOB: {p.date_of_birth}, Sex: {p.sex}, "
        f"Phone: {p.phone_number}, "
        f"Address: {p.address_line_1}"
        f"{', ' + p.address_line_2 if p.address_line_2 else ''}, "
        f"{p.city}, {p.state} {p.zip_code}. "
        f"Patient ID: {p.patient_id}."
    )


def _handle_create_patient(args: Dict[str, Any], db: Session) -> str:
    """Handle the create_patient tool call from Vapi."""
    try:
        data = PatientCreate(**args)
        patient = create_patient(db, data)
        return (
            f"Successfully registered patient. {_patient_to_str(patient)}"
        )
    except Exception as e:
        return f"Error creating patient: {str(e)}"


def _handle_get_patient(args: Dict[str, Any], db: Session) -> str:
    """Handle the get_patient tool call from Vapi."""
    patient_id = args.get("patient_id", "")
    patient = get_patient(db, patient_id)
    if not patient or patient.deleted_at is not None:
        return "Patient not found."
    return _patient_to_str(patient)


def _handle_search_patients(args: Dict[str, Any], db: Session) -> str:
    """Handle the search_patients tool call from Vapi."""
    patients = get_patients(
        db,
        last_name=args.get("last_name"),
        date_of_birth=args.get("date_of_birth"),
        phone_number=args.get("phone_number"),
    )
    if not patients:
        return "No patients found matching the search criteria."
    results = [_patient_to_str(p) for p in patients[:10]]
    return f"Found {len(patients)} patient(s). " + " | ".join(results)


# Mapping of Vapi function names → handlers
TOOL_HANDLERS = {
    "create_patient": _handle_create_patient,
    "get_patient": _handle_get_patient,
    "search_patients": _handle_search_patients,
}


@router.post("/webhook")
async def vapi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives Vapi tool-call webhook requests and returns results.

    Vapi expects a response in the format:
    { "results": [ { "toolCallId": "...", "result": "..." } ] }
    """
    body = await request.json()

    message = body.get("message", {})
    message_type = message.get("type", "")

    # Only handle tool-calls type
    if message_type != "tool-calls":
        return {"results": []}

    tool_calls = message.get("toolCallList", [])
    results: List[Dict[str, str]] = []

    for tool_call in tool_calls:
        call_id = tool_call.get("id", "")
        function_info = tool_call.get("function", {})
        func_name = function_info.get("name", "")
        arguments = function_info.get("arguments", {})

        # If arguments is a string, parse it
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                arguments = {}

        handler = TOOL_HANDLERS.get(func_name)
        if handler:
            result = handler(arguments, db)
        else:
            result = f"Unknown tool: {func_name}"

        results.append({"toolCallId": call_id, "result": result})

    return {"results": results}
