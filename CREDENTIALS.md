# TeamFlow Demo Credentials

All accounts use the same password: **password123**

## Manager (Full Access)
- **Email:** manager@teamflow.com
- **Name:** Alex Manager
- **Permissions:** Create/delete projects, manage all users, full access

## Team Leaders (Project Management)
- **Email:** leader1@teamflow.com
  - **Name:** Sarah Leader
  - **Projects:** E-Commerce Platform, AI Chatbot
  
- **Email:** leader2@teamflow.com
  - **Name:** Mike Leader
  - **Projects:** Mobile Banking App

## Team Members (Task Execution)
1. **john@teamflow.com** - John Smith (E-Commerce Platform)
2. **emma@teamflow.com** - Emma Wilson (E-Commerce Platform)
3. **david@teamflow.com** - David Brown (E-Commerce Platform)
4. **lisa@teamflow.com** - Lisa Johnson (E-Commerce Platform)
5. **tom@teamflow.com** - Tom Garcia (Mobile Banking App)
6. **amy@teamflow.com** - Amy Martinez (Mobile Banking App)
7. **chris@teamflow.com** - Chris Lee (Mobile Banking App)
8. **nina@teamflow.com** - Nina Patel (AI Chatbot)

---

## Sample Projects

### 1. E-Commerce Platform (ACTIVE)
- **Team:** Manager + Leader1 + John, Emma, David, Lisa
- **Stories:** 3 (User Authentication, Product Catalog, Shopping Cart)
- **Tasks:** 9 tasks across different statuses

### 2. Mobile Banking App (ACTIVE)
- **Team:** Manager + Leader2 + Tom, Amy, Chris
- **Stories:** 2 (Account Balance, Money Transfer)
- **Tasks:** 5 tasks with urgent priorities

### 3. AI Customer Support Chatbot (PLANNING)
- **Team:** Manager + Leader1 + Nina
- **Stories:** 1 (OpenAI Integration)
- **Tasks:** 2 tasks in planning phase

---

## Quick Start

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser:**
   http://localhost:5173

4. **Login** with any email above and password: **password123**

---

## Features to Test

### As Manager (manager@teamflow.com):
- ✅ View all 3 projects on Dashboard
- ✅ Create new projects
- ✅ Delete projects
- ✅ View all team statistics
- ✅ Access all project details

### As Team Leader (leader1@teamflow.com or leader2@teamflow.com):
- ✅ View assigned projects
- ✅ Create/edit/delete stories and tasks
- ✅ Manage project members
- ✅ Drag tasks on Kanban board
- ✅ Assign tasks to team members

### As Team Member (john@teamflow.com, etc.):
- ✅ View assigned projects
- ✅ View tasks assigned to them
- ✅ Update task status via Kanban board
- ✅ View notifications
- ✅ Update profile settings
