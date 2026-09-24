import os
from datetime import date
from app.database import SessionLocal, Base, engine
from app.models import Patient
from app.schemas import SexEnum

def seed_data():
    db = SessionLocal()
    
    # Check if we already have patients
    if db.query(Patient).count() > 0:
        print("Database already has data. Skipping seed.")
        return

    # Patient 1
    p1 = Patient(
        first_name="Alice",
        last_name="Smith",
        date_of_birth=date(1985, 4, 12),
        sex=SexEnum.female.value,
        phone_number="5551234567",
        email="alice.smith@example.com",
        address_line_1="123 Maple Street",
        city="Springfield",
        state="IL",
        zip_code="62701",
        insurance_provider="BlueCross",
        insurance_member_id="BC123456789"
    )

    # Patient 2
    p2 = Patient(
        first_name="Bob",
        last_name="Johnson",
        date_of_birth=date(1992, 11, 5),
        sex=SexEnum.male.value,
        phone_number="5559876543",
        email="bjohnson@example.com",
        address_line_1="456 Oak Avenue",
        address_line_2="Apt 2B",
        city="Austin",
        state="TX",
        zip_code="73301",
        preferred_language="Spanish",
        emergency_contact_name="Sarah Johnson",
        emergency_contact_phone="5551112222"
    )

    db.add(p1)
    db.add(p2)
    db.commit()
    print("Seed data inserted successfully!")
    db.close()

if __name__ == "__main__":
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    seed_data()
