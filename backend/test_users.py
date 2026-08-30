import sys
import os
sys.path.append(os.getcwd())
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.schemas.user import UserOut

db = SessionLocal()
users = db.query(User).filter(User.role == RoleEnum.CUSTOMER).all()
for u in users:
    try:
        out = UserOut.model_validate(u)
        print("OK", u.email)
    except Exception as e:
        print("ERROR", u.email, str(e))
