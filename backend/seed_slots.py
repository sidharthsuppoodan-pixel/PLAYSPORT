import os
import sys
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.ground import Ground
from app.models.slot import TimeSlot, SlotStatusEnum

def seed_slots():
    db = SessionLocal()
    try:
        # Get PlayZone Arena (Ground 1)
        ground = db.query(Ground).first()
        if not ground:
            print("No ground found!")
            return
            
        print(f"Generating 7 days of slots for ground {ground.id}...")
        now = datetime.now()
        
        created_count = 0
        for d in range(7):
            target_date = now + timedelta(days=d)
            date_str = target_date.strftime("%Y-%m-%d")
            
            for hr in range(6, 23): # 6 AM to 11 PM
                st_time = f"{hr:02d}:00"
                end_time = f"{(hr+1):02d}:00"
                
                # Check if exists
                existing = db.query(TimeSlot).filter(
                    TimeSlot.ground_id == ground.id,
                    TimeSlot.slot_date == date_str,
                    TimeSlot.start_time == st_time
                ).first()
                
                if not existing:
                    new_slot = TimeSlot(
                        ground_id=ground.id,
                        slot_date=date_str,
                        start_time=st_time,
                        end_time=end_time,
                        price=1200.0,
                        status=SlotStatusEnum.AVAILABLE
                    )
                    db.add(new_slot)
                    created_count += 1
                    
        db.commit()
        print(f"✅ Generated {created_count} available slots.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_slots()
