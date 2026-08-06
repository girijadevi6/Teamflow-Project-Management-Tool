import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .core.config import settings
from .routers import auth, projects, stories, tasks, notifications, dashboard, comments, time_logs
from .workers.due_date_worker import run_due_date_worker

# Import all models so SQLAlchemy registers them before create_all
from .models import User, Project, ProjectMember, UserStory, Task, Notification, ActivityLog, Comment, TimeLog  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teamflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified.")

    # Start the background due-date notification worker
    worker_task = asyncio.create_task(run_due_date_worker())
    logger.info("Background worker started.")

    yield

    # Graceful shutdown
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        logger.info("Background worker stopped.")


app = FastAPI(
    title="TeamFlow API",
    description=(
        "Agile Project Management Tool — "
        "Manage projects, user stories, tasks, and team members with role-based access."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — local dev origins + FRONTEND_URL + any extra origins from CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(stories.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(time_logs.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": "TeamFlow API",
        "version": "1.0.0",
        "docs": "/docs",
    }
