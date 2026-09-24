"""
API integration tests for the Patient Registration System.
"""
import pytest


# ── POST /patients ───────────────────────────────────────────────────
class TestCreatePatient:
    def test_create_success(self, client, sample_patient_data):
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 201
        body = resp.json()
        assert body["error"] is None
        assert body["data"]["first_name"] == "John"
        assert body["data"]["last_name"] == "Doe"
        assert body["data"]["patient_id"] is not None

    def test_create_missing_required_field(self, client):
        resp = client.post("/patients", json={"first_name": "Jane"})
        assert resp.status_code == 422

    def test_create_invalid_phone(self, client, sample_patient_data):
        sample_patient_data["phone_number"] = "123"
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 422

    def test_create_future_dob(self, client, sample_patient_data):
        sample_patient_data["date_of_birth"] = "2099-01-01"
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 422

    def test_create_invalid_state(self, client, sample_patient_data):
        sample_patient_data["state"] = "XX"
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 422

    def test_create_invalid_sex(self, client, sample_patient_data):
        sample_patient_data["sex"] = "Unknown"
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 422

    def test_phone_with_formatting(self, client, sample_patient_data):
        """Phone numbers with dashes/parens should be normalised."""
        sample_patient_data["phone_number"] = "(212) 555-1234"
        resp = client.post("/patients", json=sample_patient_data)
        assert resp.status_code == 201
        assert resp.json()["data"]["phone_number"] == "2125551234"


# ── GET /patients ────────────────────────────────────────────────────
class TestListPatients:
    def test_list_empty(self, client):
        resp = client.get("/patients")
        assert resp.status_code == 200
        assert resp.json()["data"] == []

    def test_list_after_create(self, client, sample_patient_data):
        client.post("/patients", json=sample_patient_data)
        resp = client.get("/patients")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 1

    def test_filter_by_last_name(self, client, sample_patient_data):
        client.post("/patients", json=sample_patient_data)
        resp = client.get("/patients", params={"last_name": "Doe"})
        assert len(resp.json()["data"]) == 1

        resp = client.get("/patients", params={"last_name": "Smith"})
        assert len(resp.json()["data"]) == 0

    def test_filter_by_phone(self, client, sample_patient_data):
        client.post("/patients", json=sample_patient_data)
        resp = client.get("/patients", params={"phone_number": "2125551234"})
        assert len(resp.json()["data"]) == 1


# ── GET /patients/{id} ──────────────────────────────────────────────
class TestGetPatient:
    def test_get_existing(self, client, sample_patient_data):
        create_resp = client.post("/patients", json=sample_patient_data)
        pid = create_resp.json()["data"]["patient_id"]

        resp = client.get(f"/patients/{pid}")
        assert resp.status_code == 200
        assert resp.json()["data"]["patient_id"] == pid

    def test_get_nonexistent(self, client):
        resp = client.get("/patients/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 200
        assert resp.json()["data"] is None
        assert resp.json()["error"] == "Patient not found"


# ── PUT /patients/{id} ──────────────────────────────────────────────
class TestUpdatePatient:
    def test_update_success(self, client, sample_patient_data):
        create_resp = client.post("/patients", json=sample_patient_data)
        pid = create_resp.json()["data"]["patient_id"]

        resp = client.put(f"/patients/{pid}", json={"first_name": "Jane"})
        assert resp.status_code == 200
        assert resp.json()["data"]["first_name"] == "Jane"
        assert resp.json()["data"]["last_name"] == "Doe"  # unchanged

    def test_update_nonexistent(self, client):
        resp = client.put(
            "/patients/00000000-0000-0000-0000-000000000000",
            json={"first_name": "Jane"},
        )
        assert resp.json()["error"] == "Patient not found"


# ── DELETE /patients/{id} ───────────────────────────────────────────
class TestDeletePatient:
    def test_soft_delete(self, client, sample_patient_data):
        create_resp = client.post("/patients", json=sample_patient_data)
        pid = create_resp.json()["data"]["patient_id"]

        del_resp = client.delete(f"/patients/{pid}")
        assert del_resp.status_code == 200
        assert del_resp.json()["data"]["deleted_at"] is not None

        # Should no longer appear in list
        list_resp = client.get("/patients")
        assert len(list_resp.json()["data"]) == 0

        # GET by ID should return not found
        get_resp = client.get(f"/patients/{pid}")
        assert get_resp.json()["error"] == "Patient not found"

    def test_double_delete(self, client, sample_patient_data):
        create_resp = client.post("/patients", json=sample_patient_data)
        pid = create_resp.json()["data"]["patient_id"]

        client.delete(f"/patients/{pid}")
        resp = client.delete(f"/patients/{pid}")
        assert resp.json()["error"] == "Patient not found"


# ── Envelope format ─────────────────────────────────────────────────
class TestEnvelopeFormat:
    def test_success_envelope(self, client, sample_patient_data):
        resp = client.post("/patients", json=sample_patient_data)
        body = resp.json()
        assert "data" in body
        assert "error" in body
        assert body["error"] is None

    def test_all_responses_have_envelope(self, client):
        """Even error responses should have the envelope."""
        resp = client.get("/patients/nonexistent-id")
        body = resp.json()
        assert "data" in body
        assert "error" in body
