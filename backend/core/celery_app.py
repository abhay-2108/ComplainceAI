from celery import Celery
from backend.config.settings import settings

celery_app = Celery(
    "compliance_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["backend.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    broker_connection_retry_on_startup=True,
    mongodb_backend_settings={
        "database": "compliance_ai",
        "taskmeta_collection": "celery_taskmeta",
    }
)

if __name__ == "__main__":
    celery_app.start()
