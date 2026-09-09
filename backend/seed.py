import os
import sys
from datetime import datetime, timedelta

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.booking import Booking, BookingStatusEnum
from app.models.payment import Payment, PaymentStatusEnum, PaymentMethodEnum
from app.models.open_match import OpenMatch, MatchParticipant, MatchStatusEnum
from app.models.tournament import Tournament, TournamentTeam, TournamentStatusEnum
from app.models.equipment import Equipment
from app.models.review import Review
from app.models.notification import Notification, NotificationTypeEnum
from app.models.audit_log import AuditLog

def seed_database():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Users...")
        
        # 1. Super Admin
        admin = User(
            email="admin@playsport.com",
            username="superadmin",
            full_name="Alex Admin",
            phone="9876543210",
            hashed_password=get_password_hash("Admin@123"),
            role=RoleEnum.ADMIN,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        db.add(admin)
        
        # 2. Approved Turf Owners
        owner1 = User(
            email="owner.kochi@playsport.com",
            username="kochi_turf_owner",
            full_name="Faizal Khan",
            phone="9847012345",
            business_name="PlayZone Sports Pvt Ltd",
            city="Kochi",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        owner2 = User(
            email="owner.tvm@playsport.com",
            username="tvm_turf_owner",
            full_name="Rajan Varma",
            phone="9847054321",
            business_name="GreenField Hub Arena",
            city="Thiruvananthapuram",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        owner3 = User(
            email="mahimanoj11@gmail.com",
            username="mahimanoj",
            full_name="Mahi Manoj",
            phone="9876500011",
            business_name="Mahi Sports Turf",
            city="Kochi",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        owner4 = User(
            email="edson11@gmail.com",
            username="edson11",
            full_name="Edson",
            phone="9876500022",
            business_name="Edson Arena",
            city="Kochi",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        db.add_all([owner1, owner2])

        # 3. Pending Turf Owners (Matching Stitch Admin Panel)
        pending1 = User(
            email="ramesh.kumar@metrosports.com",
            username="ramesh_metro",
            full_name="Ramesh Kumar",
            phone="9811099887",
            business_name="Metro Sports Complex",
            city="Ernakulam",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=False
        )
        pending2 = User(
            email="anita.desai@greenvalley.com",
            username="anita_greenvalley",
            full_name="Anita Desai",
            phone="9822011223",
            business_name="Green Valley Turf",
            city="Malappuram",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=False
        )
        pending3 = User(
            email="vikram.singh@downtown.com",
            username="vikram_downtown",
            full_name="Vikram Singh",
            phone="9833044556",
            business_name="Downtown Arena",
            city="Kozhikode",
            hashed_password=get_password_hash("Owner@123"),
            role=RoleEnum.OWNER,
            is_active=True,
            is_verified=True,
            is_approved=False
        )
        db.add_all([pending1, pending2, pending3])

        # 4. Customers
        customer1 = User(
            email="arjun.nair@example.com",
            username="arjunnair",
            full_name="Arjun Nair",
            phone="9847123456",
            hashed_password=get_password_hash("Customer@123"),
            role=RoleEnum.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        customer2 = User(
            email="rahul.kumar@example.com",
            username="rahulkumar",
            full_name="Rahul Kumar",
            phone="9847654321",
            hashed_password=get_password_hash("Customer@123"),
            role=RoleEnum.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        customer3 = User(
            email="sarah.j@example.com",
            username="sarahj",
            full_name="Sarah J.",
            phone="9847778899",
            hashed_password=get_password_hash("Customer@123"),
            role=RoleEnum.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        customer4 = User(
            email="amit.m@example.com",
            username="amitm",
            full_name="Amit M.",
            phone="9847334455",
            hashed_password=get_password_hash("Customer@123"),
            role=RoleEnum.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        customer5 = User(
            email="vikram.p@example.com",
            username="vikramp",
            full_name="Vikram P.",
            phone="9847990011",
            hashed_password=get_password_hash("Customer@123"),
            role=RoleEnum.CUSTOMER,
            is_active=True,
            is_verified=True,
            is_approved=True
        )
        db.add_all([customer1, customer2, customer3, customer4, customer5])
        db.flush()

        print("Seeding Turfs...")
        # Turf 1: PlayZone Arena (Primary Showcase from Stitch)
        turf1 = Turf(
            owner_id=owner1.id,
            name="PlayZone Arena",
            slug="playzone-arena",
            description="PlayZone Arena is Kochi's premier sporting destination, offering state-of-the-art FIFA approved artificial turf. Ideal for 5-a-side football and box cricket. The facility is equipped with high-intensity LED floodlights ensuring excellent visibility for evening and night matches. We provide a clean, safe, and highly professional environment for both casual games and competitive tournaments.",
            address="Kaloor Stadium Road, Kochi, Kerala",
            city="Kochi",
            state="Kerala",
            pincode="682017",
            latitude=9.9982,
            longitude=76.3005,
            contact_phone="0484-2345678",
            contact_email="playzone@playsport.com",
            rating=4.8,
            review_count=124,
            starting_price=1200.0,
            dimension_text="6000 sq ft",
            sports_supported="5v5 Football, Cricket, Badminton",
            opening_time="06:00 AM",
            closing_time="11:00 PM",
            is_active=True
        )
        turf1.facilities = [
            "Free Parking",
            "Changing Rooms",
            "Drinking Water",
            "LED Floodlights",
            "Spectator Seating",
            "First Aid Kit"
        ]
        turf1.images = [
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80"
        ]
        db.add(turf1)

        # Turf 2: Arena 54 (From Stitch Home)
        turf2 = Turf(
            owner_id=owner1.id,
            name="Arena 54",
            slug="arena-54",
            description="Premium 5-a-side astro turf with shock pad cushioning and tournament grade floodlights. Located near Infopark Kakkanad.",
            address="Near Infopark Phase 1, Kakkanad, Kochi",
            city="Kochi",
            state="Kerala",
            pincode="682030",
            rating=4.8,
            review_count=120,
            starting_price=1200.0,
            dimension_text="5500 sq ft",
            sports_supported="Football (5v5), Box Cricket",
            is_active=True
        )
        turf2.facilities = ["Free Parking", "Changing Rooms", "LED Floodlights", "Cafeteria"]
        turf2.images = ["https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80"]
        db.add(turf2)

        # Turf 3: GreenField Hub (From Stitch Home)
        turf3 = Turf(
            owner_id=owner2.id,
            name="GreenField Hub",
            slug="greenfield-hub",
            description="Expansive sports complex featuring multiple box cricket pitches and standard football turf in Trivandrum.",
            address="Near University Stadium, Karyavattom, TVM",
            city="Thiruvananthapuram",
            state="Kerala",
            pincode="695581",
            rating=4.6,
            review_count=85,
            starting_price=1500.0,
            dimension_text="8000 sq ft",
            sports_supported="Cricket, Football (7v7)",
            is_active=True
        )
        turf3.facilities = ["Parking", "Locker Rooms", "Floodlights", "Refreshment Bar"]
        turf3.images = ["https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80"]
        db.add(turf3)

        # Turf 4: Skyline Sports (From Stitch Home)
        turf4 = Turf(
            owner_id=admin.id,
            name="Skyline Sports",
            slug="skyline-sports",
            description="Rooftop panoramic sports arena in Kozhikode with scenic skyline views, international turf carpet, and cafe lounge.",
            address="Mavoor Road, Kozhikode, Kerala",
            city="Kozhikode",
            state="Kerala",
            pincode="673001",
            rating=4.9,
            review_count=210,
            starting_price=1800.0,
            dimension_text="7200 sq ft",
            sports_supported="Football (5v5), Basketball, Box Cricket",
            is_active=True
        )
        turf4.facilities = ["Rooftop View", "Valet Parking", "Lounge", "Floodlights", "Pro Shop"]
        turf4.images = ["https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80"]
        db.add(turf4)
        db.flush()

        print("Seeding Grounds...")
        # Grounds for PlayZone Arena (Matching Stitch Dashboard)
        g1 = Ground(turf_id=turf1.id, name="Turf A (5v5)", sport_type="Football", ground_size="5v5", hourly_rate=1200.0)
        g2 = Ground(turf_id=turf1.id, name="Turf B (Box Cricket)", sport_type="Cricket", ground_size="Box Cricket", hourly_rate=1500.0)
        g3 = Ground(turf_id=turf1.id, name="Turf C (7v7)", sport_type="Football", ground_size="7v7", hourly_rate=1800.0)
        g4 = Ground(turf_id=turf1.id, name="Turf D (Multipurpose)", sport_type="Badminton", ground_size="Standard Court", hourly_rate=800.0)
        
        # Grounds for others
        g5 = Ground(turf_id=turf2.id, name="Arena 54 Main Pitch", sport_type="Football", ground_size="5v5", hourly_rate=1200.0)
        g6 = Ground(turf_id=turf3.id, name="GreenField Cricket Box", sport_type="Cricket", ground_size="Box Cricket", hourly_rate=1500.0)
        g7 = Ground(turf_id=turf4.id, name="Skyline Rooftop Court", sport_type="Football", ground_size="5v5", hourly_rate=1800.0)
        
        db.add_all([g1, g2, g3, g4, g5, g6, g7])
        db.flush()

        today = datetime.now()
        today_str = today.strftime("%Y-%m-%d")

        print("Seeding Tournaments...")
        tourn1 = Tournament(
            turf_id=turf1.id,
            creator_id=owner1.id,
            title="Kochi Champions Cup (5v5 Knockout)",
            sport="Football",
            format="Knockout",
            start_date=(today + timedelta(days=10)).strftime("%Y-%m-%d"),
            end_date=(today + timedelta(days=12)).strftime("%Y-%m-%d"),
            registration_deadline=(today + timedelta(days=8)).strftime("%Y-%m-%d"),
            max_teams=16,
            current_teams=12,
            entry_fee=2500.0,
            prize_pool=30000.0,
            status=TournamentStatusEnum.REGISTRATION_OPEN,
            rules="FIFA 5v5 rules. 15 minute halves. Trophies & cash prizes for Winner and Runner Up.",
            banner_url="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
        )
        db.add(tourn1)

        print("Seeding Equipment...")
        db.add_all([
            Equipment(turf_id=turf1.id, name="FIFA Pro Match Football (Size 5)", category="Balls", total_quantity=10, available_quantity=8, price_per_hour=100.0),
            Equipment(turf_id=turf1.id, name="Kashmir Willow Box Cricket Bat", category="Bats", total_quantity=8, available_quantity=6, price_per_hour=150.0),
            Equipment(turf_id=turf1.id, name="Yonex Carbonex Badminton Rackets (Pair)", category="Rackets", total_quantity=6, available_quantity=6, price_per_hour=120.0),
            Equipment(turf_id=turf1.id, name="Neon Training Bibs (Set of 10)", category="Bibs", total_quantity=15, available_quantity=14, price_per_hour=80.0),
            Equipment(turf_id=turf1.id, name="Agility Training Cones & Markers", category="Protective", total_quantity=20, available_quantity=20, price_per_hour=50.0),
        ])

        print("Seeding Customer Reviews (Matching Stitch UI screenshot)...")
        # Review 1: Arjun Nair (Oct 12, 2023)
        rev1 = Review(
            turf_id=turf1.id,
            user_id=customer1.id,
            rating=5.0,
            comment="Excellent turf quality. The ball rolls smoothly and the cushioning is great, minimal impact on the knees. The floodlights are bright and cover the entire pitch evenly. Highly recommended for evening games.",
            user_initials="AJ",
            is_verified=True,
            created_at=datetime(2023, 10, 12, 18, 30)
        )
        # Review 2: Rahul Kumar (Oct 05, 2023)
        rev2 = Review(
            turf_id=turf1.id,
            user_id=customer2.id,
            rating=5.0,
            comment="Good facilities overall. Changing rooms are clean. Parking can get a bit tight during peak hours on weekends, but otherwise a solid place to play. Will book again.",
            user_initials="RK",
            is_verified=True,
            created_at=datetime(2023, 10, 5, 20, 15)
        )
        db.add_all([rev1, rev2])

        print("Seeding Bookings & Payments (Matching Stitch dashboard)...")
        # Sample confirmed booking matching Stitch confirmation modal (STC-78429)
        sample_bk = Booking(
            booking_reference="STC-78429",
            user_id=customer1.id,
            turf_id=turf1.id,
            ground_id=g1.id,
            booking_date=today_str,
            start_time="18:00",
            end_time="20:00",
            total_amount=3000.0,
            discount_amount=0.0,
            final_amount=3000.0,
            status=BookingStatusEnum.CONFIRMED,
            customer_notes="Weekend 5v5 session with college friends"
        )
        db.add(sample_bk)
        db.flush()

        sample_pay = Payment(
            booking_id=sample_bk.id,
            user_id=customer1.id,
            amount=3000.0,
            payment_method=PaymentMethodEnum.UPI,
            status=PaymentStatusEnum.SUCCESS
        )
        db.add(sample_pay)

        # Audit logs
        audit1 = AuditLog(
            user_id=admin.id,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id="0",
            details="PLAYSPORT MCA Minor Project initialized with seed dataset."
        )
        db.add(audit1)

        db.commit()
        print("✅ Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Seeding error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
