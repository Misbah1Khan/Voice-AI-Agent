# 🎙️ VoiceReg — Patient Registration System

A full-stack patient registration system powered by **FastAPI**, **SQLite**, and **React**, with a **Vapi** voice AI webhook integration for conversational patient intake.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Python 3.10+, FastAPI, SQLAlchemy   |
| Database   | SQLite (`patients.db`)              |
| Frontend   | React 19, Vite, Tailwind CSS v4     |
| Voice AI   | Vapi webhook integration            |
| Testing    | pytest                              |

---

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Start the Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** for the dashboard, or **http://localhost:8000/docs** for the interactive API documentation.

### 4. Run Tests

```bash
cd backend
python -m pytest tests/ -v
```

---

## API Endpoints

All responses are wrapped in the envelope format: `{"data": ..., "error": ...}`

| Method   | Endpoint             | Description                 | Status |
|----------|----------------------|-----------------------------|--------|
| `GET`    | `/patients`          | List all patients (filterable) | 200    |
| `GET`    | `/patients/{id}`     | Get a single patient        | 200    |
| `POST`   | `/patients`          | Register a new patient      | 201    |
| `PUT`    | `/patients/{id}`     | Update a patient (partial)  | 200    |
| `DELETE` | `/patients/{id}`     | Soft-delete a patient       | 200    |
| `POST`   | `/vapi/webhook`      | Vapi voice agent webhook    | 200    |

### Query Parameters for `GET /patients`

- `last_name` — Filter by last name (partial, case-insensitive)
- `date_of_birth` — Filter by exact date (YYYY-MM-DD)
- `phone_number` — Filter by exact 10-digit phone

---

## Vapi Integration

The `/vapi/webhook` endpoint handles Vapi tool-call requests. Configure these tools in your Vapi assistant:

### `create_patient`
Registers a new patient. Parameters: `first_name`, `last_name`, `date_of_birth`, `sex`, `phone_number`, `address_line_1`, `city`, `state`, `zip_code`, and optional fields.

### `get_patient`
Retrieves a patient by `patient_id`.

### `search_patients`
Searches patients by `last_name`, `date_of_birth`, or `phone_number`.

---

## Data Validations

- **phone_number**: Must be exactly 10 digits (formatting is stripped automatically)
- **date_of_birth**: Cannot be in the future
- **state**: Must be a valid 2-letter US state/territory abbreviation
- **sex**: Must be one of: `Male`, `Female`, `Other`, `Decline to Answer`
- **Soft-delete**: `DELETE` sets `deleted_at` timestamp; record is excluded from queries but not removed

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py          ← FastAPI entry point
│   │   ├── models.py        ← SQLAlchemy ORM model
│   │   ├── schemas.py       ← Pydantic validation
│   │   ├── crud.py          ← Database operations
│   │   ├── database.py      ← SQLite/SQLAlchemy config
│   │   └── routers/
│   │       ├── patients.py  ← REST API endpoints
│   │       └── vapi.py      ← Vapi webhook handler
│   ├── tests/
│   │   ├── conftest.py      ← Test fixtures
│   │   └── test_api.py      ← 19 integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Dashboard UI
│   │   ├── main.jsx         ← React entry
│   │   └── index.css        ← Design system
│   ├── index.html
│   └── vite.config.js
└── README.md
```
