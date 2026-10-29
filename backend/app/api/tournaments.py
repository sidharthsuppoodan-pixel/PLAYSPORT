from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner_or_admin
from app.models.tournament import Tournament, TournamentTeam, TournamentStatusEnum
from app.models.turf import Turf
from app.models.user import User, RoleEnum
from app.models.notification import Notification, NotificationTypeEnum
from app.schemas.tournament import TournamentCreate, TournamentOut, TournamentTeamOut, TeamRegisterRequest

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])

def sanitize_banner_url(url: Optional[str], sport: Optional[str] = None) -> str:
    default_football = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
    default_cricket = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80"
    default_badminton = "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80"
    default_basketball = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80"

    def_url = default_football
    if sport:
        s_lower = sport.lower()
        if "cricket" in s_lower:
            def_url = default_cricket
        elif "badminton" in s_lower:
            def_url = default_badminton
        elif "basket" in s_lower:
            def_url = default_basketball

    if not url:
        return def_url

    cleaned = str(url).strip()
    if (cleaned.startswith("'") and cleaned.endswith("'")) or (cleaned.startswith('"') and cleaned.endswith('"')):
        cleaned = cleaned[1:-1].strip()
    if not cleaned or cleaned.lower() in ("none", "null", "undefined"):
        return def_url
    return cleaned

@router.get("", response_model=List[TournamentOut])
def list_tournaments(
    sport: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Tournament)
    if sport and sport != "All Sports":
        query = query.filter(Tournament.sport.ilike(f"%{sport}%"))
    if status_filter:
        query = query.filter(Tournament.status == status_filter)
        
    tournaments = query.order_by(Tournament.start_date.asc()).all()
    results = []
    for t in tournaments:
        turf = db.query(Turf).filter(Turf.id == t.turf_id).first()
        teams = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == t.id).all()
        team_outs = []
        for tm in teams:
            cap = db.query(User).filter(User.id == tm.captain_id).first()
            team_outs.append(TournamentTeamOut(
                id=tm.id,
                team_name=tm.team_name,
                captain_id=tm.captain_id,
                captain_name=tm.captain_name or (cap.full_name if cap else "Team Captain"),
                contact_phone=tm.contact_phone,
                members_count=tm.members_count,
                created_at=tm.created_at
            ))
        
        results.append(TournamentOut(
            id=t.id,
            turf_id=t.turf_id,
            title=t.title,
            sport=t.sport,
            format=t.format,
            start_date=t.start_date,
            end_date=t.end_date,
            registration_deadline=t.registration_deadline,
            max_teams=t.max_teams,
            current_teams=t.current_teams,
            entry_fee=t.entry_fee,
            prize_pool=t.prize_pool,
            status=t.status,
            rules=t.rules,
            banner_url=sanitize_banner_url(t.banner_url, t.sport),
            turf_name=turf.name if turf else "PlayZone Arena",
            turf_city=turf.city if turf else "Kochi",
            created_at=t.created_at,
            creator_id=t.creator_id,
            teams=team_outs
        ))
    return results

@router.post("", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
def create_tournament(
    tourn_in: TournamentCreate,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    # Auto-resolve owner's turf facility if user is OWNER
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
        
        provided_turf = db.query(Turf).filter(Turf.id == tourn_in.turf_id).first()
        if not provided_turf or provided_turf.owner_id != current_user.id:
            tourn_in.turf_id = user_turf.id

    turf = db.query(Turf).filter(Turf.id == tourn_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

    if current_user.role != RoleEnum.ADMIN and turf.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this turf facility.")

    # Ensure sport is added to sports_supported if not present
    if tourn_in.sport and turf.sports_supported:
        if tourn_in.sport.lower() not in turf.sports_supported.lower():
            turf.sports_supported = f"{turf.sports_supported}, {tourn_in.sport}"
            db.flush()

    final_banner_url = sanitize_banner_url(tourn_in.banner_url, tourn_in.sport)

    tourn = Tournament(
        turf_id=tourn_in.turf_id,
        creator_id=current_user.id,
        title=tourn_in.title,
        sport=tourn_in.sport,
        format=tourn_in.format,
        start_date=tourn_in.start_date,
        end_date=tourn_in.end_date,
        registration_deadline=tourn_in.registration_deadline,
        max_teams=tourn_in.max_teams,
        current_teams=0,
        entry_fee=tourn_in.entry_fee,
        prize_pool=tourn_in.prize_pool,
        status=TournamentStatusEnum.REGISTRATION_OPEN,
        rules=tourn_in.rules,
        banner_url=final_banner_url
    )
    db.add(tourn)
    db.commit()
    db.refresh(tourn)

    return TournamentOut(
        id=tourn.id,
        turf_id=tourn.turf_id,
        title=tourn.title,
        sport=tourn.sport,
        format=tourn.format,
        start_date=tourn.start_date,
        end_date=tourn.end_date,
        registration_deadline=tourn.registration_deadline,
        max_teams=tourn.max_teams,
        current_teams=0,
        entry_fee=tourn.entry_fee,
        prize_pool=tourn.prize_pool,
        status=tourn.status,
        rules=tourn.rules,
        banner_url=final_banner_url,
        turf_name=turf.name,
        turf_city=turf.city,
        created_at=tourn.created_at,
        creator_id=tourn.creator_id,
        teams=[]
    )

@router.post("/{tourn_id}/register-team", response_model=dict)
def register_team(
    tourn_id: int,
    reg_in: TeamRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tourn = db.query(Tournament).filter(Tournament.id == tourn_id).first()
    if not tourn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")

    if tourn.status in [TournamentStatusEnum.COMPLETED, TournamentStatusEnum.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration is closed. Tournament has {tourn.status.value.lower()}."
        )

    if tourn.current_teams >= tourn.max_teams:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tournament team slots are full.")

    # Check if this user has already registered a team
    user_team = db.query(TournamentTeam).filter(
        TournamentTeam.tournament_id == tourn.id,
        TournamentTeam.captain_id == current_user.id
    ).first()
    if user_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already registered team '{user_team.team_name}' for this tournament."
        )

    # Check for duplicate team name within this tournament
    same_team = db.query(TournamentTeam).filter(
        TournamentTeam.tournament_id == tourn.id,
        func.lower(TournamentTeam.team_name) == func.lower(reg_in.team_name.strip())
    ).first()
    if same_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A team named '{reg_in.team_name.strip()}' is already registered in this tournament."
        )

    team = TournamentTeam(
        tournament_id=tourn.id,
        captain_id=current_user.id,
        captain_name=reg_in.captain_name.strip(),
        team_name=reg_in.team_name.strip(),
        contact_phone=reg_in.contact_phone.strip(),
        members_count=reg_in.members_count,
        payment_status="PAID",
        seed_number=tourn.current_teams + 1
    )
    db.add(team)
    tourn.current_teams += 1
    
    if tourn.current_teams >= tourn.max_teams:
        tourn.status = TournamentStatusEnum.IN_PROGRESS

    notif = Notification(
        user_id=current_user.id,
        title="Tournament Registration Confirmed! 🥇",
        message=f"Team '{reg_in.team_name}' registered for '{tourn.title}'.",
        type=NotificationTypeEnum.TOURNAMENT,
        link="/tournaments"
    )
    db.add(notif)
    db.commit()

    return {
        "message": f"Team '{reg_in.team_name}' successfully registered for {tourn.title}!",
        "tournament_id": tourn.id,
        "team_id": team.id,
        "current_teams": tourn.current_teams,
        "max_teams": tourn.max_teams
    }

@router.delete("/{tourn_id}", status_code=status.HTTP_200_OK)
def delete_tournament(
    tourn_id: int,
    current_user: User = Depends(require_owner_or_admin),
    db: Session = Depends(get_db)
):
    tourn = db.query(Tournament).filter(Tournament.id == tourn_id).first()
    if not tourn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
        
    if current_user.role != RoleEnum.ADMIN and tourn.creator_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this tournament.")
        
    db.delete(tourn)
    db.commit()
    return {"detail": "Tournament deleted successfully"}

