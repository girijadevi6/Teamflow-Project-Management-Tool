from sqlalchemy.orm import Session
from ..models.activity import ActivityLog


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int = None,
    entity_name: str = None,
    project_id: int = None,
    detail: str = None,
):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_name=entity_name,
        project_id=project_id,
        detail=detail,
    )
    db.add(log)
    db.commit()
