"""
TeamFlow Static Knowledge Base

Extracted from TeamFlow_AI_Knowledge_Base.pdf
Contains static documentation about TeamFlow feature navigation, usage, workflows, roles, and permissions.
"""

STATIC_KNOWLEDGE_BASE = """
# TeamFlow Website Knowledge Base

## 1. About TeamFlow
- TeamFlow is an Agile project management application for small teams.
- Main hierarchy: Project → User Story → Task.
- TeamFlow supports project management, task assignment, Kanban workflow, comments, notifications, reports, activity tracking, and time tracking.

## 2. Authentication
- Users can register and log in using their credentials.
- Login requires email and password.
- Authenticated users access protected application features using JWT authentication.
- Users can open their profile from the user menu and sign out from the profile/user menu.

## 3. Main Navigation
- Main navigation provides access to Dashboard, Projects, My Tasks, Reports (for authorized roles: Managers and Team Leaders), Notifications, and Profile.
- The TeamFlow logo returns the user to the Dashboard.

## 4. Dashboard
- The Dashboard provides an overview of project and task information.
- It displays project/task statistics and provides access to projects.
- Managers can create projects from the Dashboard when authorized.

## 5. Projects
- Projects are the top level of the work hierarchy.
- Users can view projects they are authorized to access.
- Projects contain name, description, status, priority, deadline, team members, User Stories, and Tasks.
- Project statuses include: Planning, Active, Pending, Pending Review, On Hold, Completed, and Archived.
- Project priorities include: Low, Medium, High, and Urgent.

## 6. Project Details
- Opening a project displays its hierarchy: Project → User Stories → Tasks.
- User Stories can be expanded or collapsed to view their tasks.
- Project management actions depend on the user's role and permissions.

## 7. User Stories
- A User Story belongs to one Project.
- User Stories contain title, description, priority, status, creator, and tasks.
- Statuses: To Do, In Progress, Done.
- Priorities: Low, Medium, High, Urgent.
- Authorized users can create, view, edit, and delete User Stories.

## 8. Tasks
- A Task belongs to one User Story.
- Tasks can contain title, description, status, priority, assignee, due date, story points, estimated hours, logged hours, and creator.
- Statuses: To Do, In Progress, In Review, Done.
- Priorities: Low, Medium, High, Urgent.
- Authorized users can create, view, edit, delete, assign, and update tasks.

## 9. Task Assignment
- Tasks can be assigned to project members.
- Assigned users can find their tasks in My Tasks.
- Managers and Team Leaders can assign tasks according to project permissions.
- Members can update tasks assigned to them according to permissions.

## 10. My Tasks
- My Tasks shows tasks assigned to the authenticated user, grouped by project.
- Tasks can be filtered by status.
- Users can open a task and access its discussion/comments.

## 11. Kanban Board
- The Kanban board organizes tasks into To Do, In Progress, In Review, and Done.
- It provides a visual way to track work through the Agile workflow.
- Task movement/status changes are subject to permissions.

## 12. Task Discussions / Comments
- Each task has a discussion section.
- Comments are attached to the specific task.
- Authorized project members can view and participate in task discussions.
- Comments contain author, content, created time, and updated time.
- Comment access follows project authorization.

## 13. Notifications
- TeamFlow provides in-app notifications.
- Notifications can relate to task assignment, task status changes, deadlines, comments, review requests, project changes, approvals, and other project activity.
- Users can view notifications, mark them as read, mark all as read, delete them, and open the full Notifications page.

## 14. Background Notifications
- TeamFlow has an asynchronous background worker.
- The worker checks deadlines and can generate notifications for upcoming/overdue tasks and project deadlines.
- The worker avoids duplicate notifications.
- If a worker scan fails, the error is logged and the next cycle continues.

## 15. Reports
- Reports are available to authorized Managers and Team Leaders.
- Reports can show project progress, task distribution, story breakdown, completed/in-progress/review/to-do tasks, overdue tasks, story points, and team workload.
- Project reports can be downloaded as CSV.

## 16. Time Tracking
- Tasks support time tracking.
- Users can record hours and a description for work performed on a task.
- Time logs belong to tasks and contribute to logged hours.

## 17. Roles and Permissions
- Manager: broad project-management permissions, including project management, member management, stories, tasks, assignments, and reports. Managers see all projects in the system.
- Team Leader: manages projects they lead, stories, tasks, assignments, reports, and project discussions according to permissions.
- Member: views projects they belong to, works with assigned tasks, updates permitted task status, and participates in discussions.
- Backend authorization is the security mechanism; frontend button visibility is not sufficient.

## 18. How to Create a Project
- Open Dashboard or Projects → select New Project → enter project details → choose status/priority → optionally set deadline and Team Leader → create the project.

## 19. How to Add Team Members
- Open the relevant Project → open member management → select a user → assign the appropriate project role → save.

## 20. How to Create a User Story
- Open a Project → add a User Story → enter title/description → select priority/status → save.

## 21. How to Create a Task
- Open a Project → open the relevant User Story → add a Task → enter task details → assign a member if needed → optionally set due date, story points, and estimated hours → save.

## 22. How to Assign a Task
- Open the Task → select Assign To → choose a member of the project → save.

## 23. How to Update a Task
- Authorized users can update title, description, priority, status, assignee, due date, story points, and estimated hours.
- Members can update permitted tasks assigned to them.

## 24. How to Comment on a Task
- Open the Task → open Task Discussion/Comments → enter the comment → select Post Comment.
- Relevant authorized project members can see the discussion.

## 25. How to Check Notifications
- Select the notification bell in the top navigation.
- The notification menu shows recent notifications and unread count.
- Open View all notifications for the full Notifications page.

## 26. How to View Project Progress
- Use Dashboard statistics, project information, Kanban board, and Reports.
- Reports provide detailed analytics for authorized Managers and Team Leaders.

## 27. How to Log Time on a Task
- Open the Task details modal/drawer -> navigate to Time Tracking section -> enter hours spent and work description -> submit time log.
"""
