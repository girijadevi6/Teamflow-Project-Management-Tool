"""
Seed script to populate the database with demo users and sample data.
Run this once: python seed_data.py
"""
import sys
import io
from datetime import date, timedelta
import bcrypt

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.project import Project, ProjectMember, MemberRole, ProjectStatus, ProjectPriority
from app.models.story import UserStory, StoryStatus, Priority as StoryPriority
from app.models.task import Task, TaskStatus, Priority as TaskPriority
from app.models.comment import Comment
from app.models.time_log import TimeLog

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Check if data already exists
    existing = db.query(User).first()
    if existing:
        print("⚠️  Database already has data. Delete teamflow.db to reset.")
        sys.exit(0)

    print("🌱 Seeding database...")

    # ── USERS ──────────────────────────────────────────────────────────────────

    # All passwords are "password123"
    # Generate hash using bcrypt directly to avoid passlib compatibility issues
    hashed_pw = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # 1 Manager
    manager = User(
        name="Alex Manager",
        email="manager@teamflow.com",
        password_hash=hashed_pw,
        role=UserRole.MANAGER,
        avatar_color="#6366f1"
    )
    db.add(manager)
    db.flush()

    # 2 Team Leaders
    leader1 = User(
        name="Sarah Leader",
        email="leader1@teamflow.com",
        password_hash=hashed_pw,
        role=UserRole.TEAM_LEADER,
        avatar_color="#ec4899"
    )
    leader2 = User(
        name="Mike Leader",
        email="leader2@teamflow.com",
        password_hash=hashed_pw,
        role=UserRole.TEAM_LEADER,
        avatar_color="#f59e0b"
    )
    db.add_all([leader1, leader2])
    db.flush()

    # 8 Team Members
    members = [
        User(name="John Smith", email="john@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#10b981"),
        User(name="Emma Wilson", email="emma@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#3b82f6"),
        User(name="David Brown", email="david@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#8b5cf6"),
        User(name="Lisa Johnson", email="lisa@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#ef4444"),
        User(name="Tom Garcia", email="tom@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#14b8a6"),
        User(name="Amy Martinez", email="amy@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#f97316"),
        User(name="Chris Lee", email="chris@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#84cc16"),
        User(name="Nina Patel", email="nina@teamflow.com", password_hash=hashed_pw,
             role=UserRole.MEMBER, avatar_color="#a855f7"),
    ]
    db.add_all(members)
    db.commit()
    print(f"✅ Created {1 + 2 + 8} users (1 Manager, 2 Leaders, 8 Members)")

    # ── PROJECT 1: E-Commerce Platform ─────────────────────────────────────────

    project1 = Project(
        name="E-Commerce Platform",
        description="Build a modern online shopping platform with React and FastAPI",
        status=ProjectStatus.ACTIVE,
        priority=ProjectPriority.HIGH,
        deadline=date.today() + timedelta(days=14),
        created_by=manager.id
    )
    db.add(project1)
    db.flush()

    # Add team members to project 1
    db.add_all([
        ProjectMember(project_id=project1.id, user_id=manager.id, role=MemberRole.OWNER),
        ProjectMember(project_id=project1.id, user_id=leader1.id, role=MemberRole.TEAM_LEADER),
        ProjectMember(project_id=project1.id, user_id=members[0].id, role=MemberRole.MEMBER),  # John
        ProjectMember(project_id=project1.id, user_id=members[1].id, role=MemberRole.MEMBER),  # Emma
        ProjectMember(project_id=project1.id, user_id=members[2].id, role=MemberRole.MEMBER),  # David
        ProjectMember(project_id=project1.id, user_id=members[3].id, role=MemberRole.MEMBER),  # Lisa
    ])
    db.flush()

    # Story 1.1: User Authentication
    story1_1 = UserStory(
        project_id=project1.id,
        title="As a customer, I want to login to my account",
        description="Implement secure user authentication with JWT",
        priority=StoryPriority.HIGH,
        status=StoryStatus.IN_PROGRESS,
        created_by=leader1.id
    )
    db.add(story1_1)
    db.flush()

    db.add_all([
        Task(story_id=story1_1.id, title="Design login UI components",
             status=TaskStatus.DONE, priority=TaskPriority.HIGH,
             assigned_to=members[1].id, created_by=leader1.id, story_points=2),
        Task(story_id=story1_1.id, title="Create login API endpoint",
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.HIGH,
             assigned_to=members[0].id, created_by=leader1.id, story_points=3,
             due_date=date.today() + timedelta(days=2)),
        Task(story_id=story1_1.id, title="Add JWT authentication middleware",
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             assigned_to=members[2].id, created_by=leader1.id, story_points=5),
        Task(story_id=story1_1.id, title="Write unit tests for auth",
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             created_by=leader1.id, story_points=3),
    ])

    # Story 1.2: Product Catalog
    story1_2 = UserStory(
        project_id=project1.id,
        title="As a customer, I want to browse products",
        description="Display product catalog with search and filters",
        priority=StoryPriority.HIGH,
        status=StoryStatus.TODO,
        created_by=leader1.id
    )
    db.add(story1_2)
    db.flush()

    db.add_all([
        Task(story_id=story1_2.id, title="Create product database schema",
             status=TaskStatus.DONE, priority=TaskPriority.HIGH,
             assigned_to=members[0].id, created_by=leader1.id, story_points=2),
        Task(story_id=story1_2.id, title="Build product grid UI",
             status=TaskStatus.IN_PROGRESS, priority=TaskPriority.MEDIUM,
             assigned_to=members[1].id, created_by=leader1.id, story_points=5,
             due_date=date.today() + timedelta(days=3)),
        Task(story_id=story1_2.id, title="Implement search functionality",
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             assigned_to=members[3].id, created_by=leader1.id, story_points=3),
    ])

    # Story 1.3: Shopping Cart
    story1_3 = UserStory(
        project_id=project1.id,
        title="As a customer, I want to add items to cart",
        description="Shopping cart with add/remove/update quantity",
        priority=StoryPriority.MEDIUM,
        status=StoryStatus.TODO,
        created_by=leader1.id
    )
    db.add(story1_3)
    db.flush()

    db.add_all([
        Task(story_id=story1_3.id, title="Design cart UI",
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             created_by=leader1.id, story_points=3),
        Task(story_id=story1_3.id, title="Create cart API endpoints",
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             created_by=leader1.id, story_points=5),
    ])

    db.commit()
    print(f"✅ Created Project 1: '{project1.name}' with 3 stories and 9 tasks")

    # ── PROJECT 2: Mobile Banking App ──────────────────────────────────────────

    project2 = Project(
        name="Mobile Banking App",
        description="Secure mobile banking application with real-time transactions",
        status=ProjectStatus.ACTIVE,
        created_by=manager.id
    )
    db.add(project2)
    db.flush()

    db.add_all([
        ProjectMember(project_id=project2.id, user_id=manager.id, role=MemberRole.OWNER),
        ProjectMember(project_id=project2.id, user_id=leader2.id, role=MemberRole.TEAM_LEADER),
        ProjectMember(project_id=project2.id, user_id=members[4].id, role=MemberRole.MEMBER),  # Tom
        ProjectMember(project_id=project2.id, user_id=members[5].id, role=MemberRole.MEMBER),  # Amy
        ProjectMember(project_id=project2.id, user_id=members[6].id, role=MemberRole.MEMBER),  # Chris
    ])
    db.flush()

    story2_1 = UserStory(
        project_id=project2.id,
        title="As a user, I want to check my account balance",
        description="Real-time balance display with transaction history",
        priority=StoryPriority.URGENT,
        status=StoryStatus.IN_PROGRESS,
        created_by=leader2.id
    )
    db.add(story2_1)
    db.flush()

    db.add_all([
        Task(story_id=story2_1.id, title="Create balance API",
             status=TaskStatus.DONE, priority=TaskPriority.URGENT,
             assigned_to=members[4].id, created_by=leader2.id, story_points=3),
        Task(story_id=story2_1.id, title="Design dashboard UI",
             status=TaskStatus.IN_REVIEW, priority=TaskPriority.URGENT,
             assigned_to=members[5].id, created_by=leader2.id, story_points=5,
             due_date=date.today() + timedelta(days=1)),
        Task(story_id=story2_1.id, title="Add security encryption",
             status=TaskStatus.TODO, priority=TaskPriority.URGENT,
             assigned_to=members[6].id, created_by=leader2.id, story_points=8),
    ])

    story2_2 = UserStory(
        project_id=project2.id,
        title="As a user, I want to transfer money",
        description="Peer-to-peer money transfer with OTP verification",
        priority=StoryPriority.HIGH,
        status=StoryStatus.TODO,
        created_by=leader2.id
    )
    db.add(story2_2)
    db.flush()

    db.add_all([
        Task(story_id=story2_2.id, title="Build transfer form UI",
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             created_by=leader2.id, story_points=3),
        Task(story_id=story2_2.id, title="Implement OTP service",
             status=TaskStatus.TODO, priority=TaskPriority.HIGH,
             created_by=leader2.id, story_points=5,
             due_date=date.today() + timedelta(days=5)),
    ])

    db.commit()
    print(f"✅ Created Project 2: '{project2.name}' with 2 stories and 5 tasks")

    # ── PROJECT 3: AI Chatbot ──────────────────────────────────────────────────

    project3 = Project(
        name="AI Customer Support Chatbot",
        description="Intelligent chatbot using GPT-4 for customer queries",
        status=ProjectStatus.PLANNING,
        created_by=manager.id
    )
    db.add(project3)
    db.flush()

    db.add_all([
        ProjectMember(project_id=project3.id, user_id=manager.id, role=MemberRole.OWNER),
        ProjectMember(project_id=project3.id, user_id=leader1.id, role=MemberRole.TEAM_LEADER),
        ProjectMember(project_id=project3.id, user_id=members[7].id, role=MemberRole.MEMBER),  # Nina
    ])
    db.flush()

    story3_1 = UserStory(
        project_id=project3.id,
        title="As an admin, I want to integrate OpenAI API",
        description="Setup GPT-4 integration with streaming responses",
        priority=StoryPriority.HIGH,
        status=StoryStatus.TODO,
        created_by=leader1.id
    )
    db.add(story3_1)
    db.flush()

    db.add_all([
        Task(story_id=story3_1.id, title="Research OpenAI API pricing",
             status=TaskStatus.TODO, priority=TaskPriority.LOW,
             assigned_to=members[7].id, created_by=leader1.id, story_points=1),
        Task(story_id=story3_1.id, title="Setup API key management",
             status=TaskStatus.TODO, priority=TaskPriority.MEDIUM,
             created_by=leader1.id, story_points=2),
    ])

    db.commit()
    print(f"✅ Created Project 3: '{project3.name}' with 1 story and 2 tasks")

    print("\n" + "="*60)
    print("🎉 Database seeded successfully!")
    print("="*60)
    print("\n📧 LOGIN CREDENTIALS (password for all: password123)\n")
    print("Manager:")
    print("  Email: manager@teamflow.com")
    print("\nTeam Leaders:")
    print("  Email: leader1@teamflow.com")
    print("  Email: leader2@teamflow.com")
    print("\nTeam Members:")
    for i, m in enumerate(members, 1):
        print(f"  {i}. {m.email}")
    print("\n" + "="*60)
    print("Start the app:")
    print("  Backend:  uvicorn app.main:app --reload --port 8000")
    print("  Frontend: npm run dev")
    print("  Then open: http://localhost:5173")
    print("="*60 + "\n")

except Exception as e:
    print(f"❌ Error seeding database: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
