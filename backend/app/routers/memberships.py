from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from dateutil.relativedelta import relativedelta
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.core.config import UserRole
from app.models import Membership, User
from app.schemas import MembershipCreate, MembershipOut
from app.utils.helpers import calculate_membership_fee, get_active_membership

router = APIRouter(prefix="/api/memberships", tags=["Memberships"])


def _add_months(d: date, months: int) -> date:
    """Cộng tháng đơn giản, không dùng dateutil"""
    year = d.year + (d.month - 1 + months) // 12
    month = (d.month - 1 + months) % 12 + 1
    day = min(d.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                      31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


@router.post("", response_model=MembershipOut)
def create_membership(
    payload: MembershipCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()
    active = get_active_membership(db, user.id)
    if active:
        # gia hạn: cộng dồn
        new_end = _add_months(active.ngay_ket_thuc, payload.thoi_han_thang)
        active.ngay_ket_thuc = new_end
        # cộng phí
        fee = calculate_membership_fee(payload.loai_the.value, payload.thoi_han_thang)
        active.phi_the = (active.phi_the or 0) + fee
        # nâng loại thẻ nếu mới cao hơn (tùy chọn — ở đây giữ nguyên)
        db.commit()
        db.refresh(active)
        return active

    fee = calculate_membership_fee(payload.loai_the.value, payload.thoi_han_thang)
    mem = Membership(
        khach_hang_id=user.id,
        loai_the=payload.loai_the,
        ngay_bat_dau=today,
        ngay_ket_thuc=_add_months(today, payload.thoi_han_thang),
        phi_the=fee,
        trang_thai="ACTIVE",
    )
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@router.get("/me", response_model=MembershipOut | None)
def get_my_membership(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_active_membership(db, user.id)


@router.get("", response_model=List[MembershipOut])
def list_memberships(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.QUAN_LY)),
):
    return db.query(Membership).order_by(Membership.id.desc()).all()
