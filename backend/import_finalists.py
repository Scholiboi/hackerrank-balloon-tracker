import csv
import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Participant

def import_csv(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found")
        return

    db = SessionLocal()
    try:
        # Clear existing participants if needed (optional, safer to just add if unique)
        # db.query(Participant).delete()
        
        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            new_participants = []
            existing_ids = {p.hackerrank_id for p in db.query(Participant).all()}

            for row in reader:
                hr_id = row.get("Username", "").strip()
                if not hr_id or hr_id in existing_ids:
                    continue
                
                p = Participant(
                    hackerrank_id=hr_id,
                    name=row.get("Name", "").strip(),
                    email=row.get("Email", "").strip(),
                    mobile=row.get("Mobile Number", "").strip(),
                    lab=row.get("Assigned Lab", "").strip(),
                    seat=row.get("Seat No", "").strip()
                )
                new_participants.append(p)
                existing_ids.add(hr_id)

            if new_participants:
                db.add_all(new_participants)
                db.commit()
                print(f"✅ Successfully imported {len(new_participants)} participants.")
            else:
                print("ℹ️ No new participants to import.")

    except Exception as e:
        print(f"❌ Error during import: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exists
    Base.metadata.create_all(bind=engine)
    csv_path = "data/finalists.csv"
    import_csv(csv_path)
