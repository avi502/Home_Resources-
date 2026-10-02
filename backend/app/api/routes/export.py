from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.services.export_service import ExportService
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/export", tags=["Data Export & Privacy"])


@router.get("/{household_id}/json")
def export_json(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports all household telemetry and settings as formatted JSON."""
    service = ExportService(db)
    data = service.export_json(current_user.id, household_id)
    return StandardResponse(data=data)


@router.get("/{household_id}/csv")
def export_csv(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports all household resource records as a standard CSV download."""
    service = ExportService(db)
    csv_content = service.export_csv(current_user.id, household_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=homeresource_household_{household_id}.csv"}
    )


@router.post("/{household_id}/wipe", response_model=StandardResponse[dict])
def wipe_household_telemetry(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """GDPR compliance: securely purges all resource observations for the household."""
    service = ExportService(db)
    deleted_count = service.wipe_household_data(current_user.id, household_id)
    return StandardResponse(data={"deleted_count": deleted_count, "message": "All household records permanently purged."})
