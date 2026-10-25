from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner_or_admin, get_optional_current_user
from app.models.open_match import OpenMatch, MatchParticipant, MatchStatusEnum
from app.models.turf import Turf
from app.models.user import User, RoleEnum
from app.models.notification import Notification, NotificationTypeEnum
from app.schemas.open_match import OpenMatchCreate, OpenMatchOut, MatchParticipantOut

router = APIRouter(prefix="/open-matches", tags=["Open Match Arena"])

def parse_slot_time_to_datetime(date_str: str, time_str: str) -> Optional[datetime]:
    """Combines YYYY-MM-DD date_str and time_str into a Python datetime object."""
    if not date_str or not time_str:
        return None
    time_str = time_str.strip()
    for fmt in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %I:%M%p", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(f"{date_str} {time_str}", fmt)
        except ValueError:
            pass
    return None

@router.get("", response_model=List[OpenMatchOut])
def list_open_matches(
    sport: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(OpenMatch)
    if sport and sport != "All Sports":
        query = query.filter(OpenMatch.sport_type.ilike(f"%{sport}%"))
    if status_filter:
        query = query.filter(OpenMatch.status == status_filter)
    
    matches = query.order_by(OpenMatch.match_date.asc(), OpenMatch.start_time.asc()).all()
    results = []
    now = datetime.now()

    user_turf_ids = []
    if current_user and current_user.role == RoleEnum.OWNER:
        user_turf_ids = [t.id for t in current_user.turfs]

    for m in matches:
        participants = db.query(MatchParticipant).filter(MatchParticipant.match_id == m.id).all()

        # Check if match start time has already passed
        match_start_dt = parse_slot_time_to_datetime(m.match_date, m.start_time)
        if match_start_dt and match_start_dt <= now:
            # Hide expired matches from users who have NOT joined or hosted it, unless they are the turf owner
            is_user_participant = False
            if current_user:
                is_user_participant = (
                    m.creator_id == current_user.id or
                    any(p.user_id == current_user.id for p in participants) or
                    current_user.role == RoleEnum.ADMIN or
                    m.turf_id in user_turf_ids
                )
            if not is_user_participant:
                continue

        turf = db.query(Turf).filter(Turf.id == m.turf_id).first()
        creator = db.query(User).filter(User.id == m.creator_id).first()
        part_outs = []
        for p in participants:
            u = db.query(User).filter(User.id == p.user_id).first()
            if u:
                part_outs.append(MatchParticipantOut(
                    id=p.id,
                    user_id=u.id,
                    full_name=u.full_name,
                    username=u.username,
                    phone=u.phone,
                    email=u.email,
                    team_slot=p.team_slot,
                    joined_at=p.joined_at
                ))
        
        slots_left = max(0, m.max_players - m.current_players)
        results.append(OpenMatchOut(
            id=m.id,
            turf_id=m.turf_id,
            ground_id=m.ground_id,
            title=m.title,
            sport_type=m.sport_type,
            skill_level=m.skill_level,
            match_date=m.match_date,
            start_time=m.start_time,
            end_time=m.end_time,
            max_players=m.max_players,
            current_players=m.current_players,
            price_per_player=m.price_per_player,
            status=m.status,
            rules=m.rules,
            description=m.description,
            turf_name=turf.name if turf else "PlayZone Arena",
            turf_city=turf.city if turf else "Kochi",
            turf_image=turf.images[0] if (turf and turf.images and len(turf.images) > 0) else None,
            slots_left=slots_left,
            created_at=m.created_at,
            creator_id=m.creator_id,
            creator_name=creator.full_name if creator else "Host",
            creator_phone=creator.phone if creator else None,
            participants=part_outs
        ))
    return results

@router.post("", response_model=OpenMatchOut, status_code=status.HTTP_201_CREATED)
def create_open_match(
    match_in: OpenMatchCreate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    now = datetime.now()

    # Reject hosting/creating open match for past date or time
    match_start_dt = parse_slot_time_to_datetime(match_in.match_date, match_in.start_time)
    if match_start_dt and match_start_dt <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot host or create an open match for a date and time that has already passed."
        )

    today_str = now.strftime("%Y-%m-%d")
    if match_in.match_date < today_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot host an open match for a past date."
        )

    # If user is OWNER, auto-resolve to their turf facility
    if current_user.role == RoleEnum.OWNER:
        user_turf = db.query(Turf).filter(Turf.owner_id == current_user.id).first()
        if not user_turf:
            from app.api.turfs import slugify
            turf_name = current_user.business_name or f"{current_user.full_name}'s Sports Arena"
            base_slug = slugify(turf_name) or "turf"
            slug = f"{base_slug}-{current_user.id}"
            user_turf = Turf(
                owner_id=current_user.id,
                name=turf_name,
                slug=slug,
                description=f"Welcome to {turf_name}.",
                address=f"{current_user.city or 'Kerala'}, India",
                city=current_user.city or "Kochi",
                state="Kerala",
                contact_phone=current_user.phone or "9876543210",
                contact_email=current_user.email,
                starting_price=1200.0,
                sports_supported="5v5 Football, Box Cricket",
                is_active=True
            )
            db.add(user_turf)
            db.flush()
        
        # Override turf_id to owner's turf if provided turf_id isn't owned by current_user
        provided_turf = db.query(Turf).filter(Turf.id == match_in.turf_id).first()
        if not provided_turf or provided_turf.owner_id != current_user.id:
            match_in.turf_id = user_turf.id

    turf = db.query(Turf).filter(Turf.id == match_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    if current_user.role != RoleEnum.ADMIN and turf.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only host open matches for your own turf.")

    # Resolve or create default Ground for Turf
    from app.models.ground import Ground
    ground = db.query(Ground).filter(Ground.turf_id == turf.id).first()
    if not ground:
        ground = Ground(
            turf_id=turf.id,
            name="Main Ground",
            sport_type="Football",
            ground_size="5v5",
            hourly_rate=turf.starting_price,
            is_active=True
        )
        db.add(ground)
        db.flush()

    # Check if an open match is already hosted for this turf at the exact same date and start_time
    existing_match = db.query(OpenMatch).filter(
        OpenMatch.turf_id == turf.id,
        OpenMatch.match_date == match_in.match_date,
        OpenMatch.start_time == match_in.start_time,
        OpenMatch.status != MatchStatusEnum.CANCELLED
    ).first()
    if existing_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An open match ('{existing_match.title}') is already hosted at this turf on {match_in.match_date} at {match_in.start_time}."
        )

    # Check slot availability & reserve slot
    from app.models.slot import TimeSlot, SlotStatusEnum
    slot = db.query(TimeSlot).filter(
        TimeSlot.ground_id == ground.id,
        TimeSlot.slot_date == match_in.match_date,
        TimeSlot.start_time == match_in.start_time
    ).first()

    if slot:
        if slot.status == SlotStatusEnum.BOOKED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This time slot is ALREADY BOOKED by a customer! You cannot host an open match during a booked time slot."
            )
        elif slot.status in [SlotStatusEnum.BLOCKED, SlotStatusEnum.MAINTENANCE]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This time slot is blocked for maintenance or unavailable."
            )
        else:
            # Mark the slot as BOOKED so regular customers can no longer book it separately
            slot.status = SlotStatusEnum.BOOKED
    else:
        # Create a new slot marked as BOOKED to reserve it for this open match
        new_slot = TimeSlot(
            ground_id=ground.id,
            slot_date=match_in.match_date,
            start_time=match_in.start_time,
            end_time=match_in.end_time,
            price=turf.starting_price,
            status=SlotStatusEnum.BOOKED
        )
        db.add(new_slot)

    new_match = OpenMatch(
        turf_id=match_in.turf_id,
        ground_id=ground.id,
        creator_id=current_user.id,
        title=match_in.title,
        sport_type=match_in.sport_type,
        skill_level=match_in.skill_level,
        match_date=match_in.match_date,
        start_time=match_in.start_time,
        end_time=match_in.end_time,
        max_players=match_in.max_players,
        current_players=0,
        price_per_player=match_in.price_per_player,
        status=MatchStatusEnum.OPEN,
        rules=match_in.rules,
        description=match_in.description
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return OpenMatchOut(
        id=new_match.id,
        turf_id=new_match.turf_id,
        ground_id=new_match.ground_id,
        title=new_match.title,
        sport_type=new_match.sport_type,
        skill_level=new_match.skill_level,
        match_date=new_match.match_date,
        start_time=new_match.start_time,
        end_time=new_match.end_time,
        max_players=new_match.max_players,
        current_players=0,
        price_per_player=new_match.price_per_player,
        status=new_match.status,
        rules=new_match.rules,
        description=new_match.description,
        turf_name=turf.name,
        turf_city=turf.city,
        turf_image=turf.images[0] if (turf and turf.images and len(turf.images) > 0) else None,
        slots_left=new_match.max_players,
        created_at=new_match.created_at,
        creator_id=new_match.creator_id,
        creator_name=current_user.full_name,
        creator_phone=current_user.phone,
        participants=[]
    )

@router.post("/{match_id}/join", response_model=dict)
def join_open_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(OpenMatch).filter(OpenMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    if match.status == MatchStatusEnum.CANCELLED or match.status == MatchStatusEnum.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Match is no longer active.")

    # Strict Capacity Guard
    if match.current_players >= match.max_players:
        match.status = MatchStatusEnum.FULL
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Match is FULL! Maximum player capacity ({match.max_players}) reached. Registration rejected."
        )

    # Check if already joined
    existing_part = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match.id,
        MatchParticipant.user_id == current_user.id
    ).first()
    if existing_part:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already joined this match.")

    # Determine team slot
    team_slot = "Team A" if match.current_players % 2 == 0 else "Team B"

    participant = MatchParticipant(
        match_id=match.id,
        user_id=current_user.id,
        team_slot=team_slot,
        payment_status="PAID"
    )
    db.add(participant)
    match.current_players += 1

    if match.current_players >= match.max_players:
        match.status = MatchStatusEnum.FULL

    # In-app notification
    notif = Notification(
        user_id=current_user.id,
        title="Joined Open Match! 🏆",
        message=f"You successfully joined '{match.title}' on {match.match_date} at {match.start_time}.",
        type=NotificationTypeEnum.MATCH,
        link="/open-matches"
    )
    db.add(notif)

    db.commit()
    return {
        "message": "Successfully joined the match!",
        "match_id": match.id,
        "current_players": match.current_players,
        "max_players": match.max_players,
        "slots_left": max(0, match.max_players - match.current_players),
        "status": match.status.value
    }

@router.post("/{match_id}/leave", response_model=dict)
def leave_open_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(OpenMatch).filter(OpenMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    participant = db.query(MatchParticipant).filter(
        MatchParticipant.match_id == match.id,
        MatchParticipant.user_id == current_user.id
    ).first()
    if not participant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are not a participant in this match.")

    if match.creator_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As the turf host of this open match, you cannot leave. Manage or cancel the match from Turf Manager."
        )

    db.delete(participant)
    match.current_players = max(0, match.current_players - 1)

    if match.status == MatchStatusEnum.FULL and match.current_players < match.max_players:
        match.status = MatchStatusEnum.OPEN

    # Notification
    notif = Notification(
        user_id=current_user.id,
        title="Participation Cancelled",
        message=f"You have cancelled your spot in '{match.title}' on {match.match_date}.",
        type=NotificationTypeEnum.MATCH,
        link="/open-matches"
    )
    db.add(notif)

    db.commit()
    return {
        "message": "Successfully cancelled your match participation.",
        "match_id": match.id,
        "current_players": match.current_players,
        "slots_left": max(0, match.max_players - match.current_players),
        "status": match.status.value
    }

@router.delete("/{match_id}", response_model=dict)
def delete_open_match(
    match_id: int,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    match = db.query(OpenMatch).filter(OpenMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    turf = db.query(Turf).filter(Turf.id == match.turf_id).first()
    if current_user.role != RoleEnum.ADMIN and (not turf or turf.owner_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete open matches hosted for your own turf."
        )

    # Restore corresponding time slot if it exists
    from app.models.slot import TimeSlot, SlotStatusEnum
    if match.ground_id:
        slot = db.query(TimeSlot).filter(
            TimeSlot.ground_id == match.ground_id,
            TimeSlot.slot_date == match.match_date,
            TimeSlot.start_time == match.start_time
        ).first()
        if slot and slot.status == SlotStatusEnum.BOOKED:
            slot.status = SlotStatusEnum.AVAILABLE

    # Delete participants and match
    db.query(MatchParticipant).filter(MatchParticipant.match_id == match.id).delete()
    db.delete(match)
    db.commit()

    return {"message": "Open match deleted successfully and slot released."}

