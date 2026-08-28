from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_owner_or_admin
from app.models.tournament import Tournament, TournamentTeam, TournamentStatusEnum
from app.models.turf import Turf
from app.models.user import User
from app.models.notification import Notification, NotificationTypeEnum
from app.schemas.tournament import TournamentCreate, TournamentOut, TournamentTeamOut, TeamRegisterRequest

router = APIRouter(prefix="/tournaments", tags=["Tournaments"])

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
                captain_name=cap.full_name if cap else "Captain",
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
            banner_url=t.banner_url,
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
    turf = db.query(Turf).filter(Turf.id == tourn_in.turf_id).first()
    if not turf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turf not found")

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
        banner_url=tourn_in.banner_url
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
        banner_url=tourn.banner_url,
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

    if tourn.current_teams >= tourn.max_teams:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tournament team slots are full.")

    team = TournamentTeam(
        tournament_id=tourn.id,
        captain_id=current_user.id,
        team_name=reg_in.team_name,
        contact_phone=reg_in.contact_phone,
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
