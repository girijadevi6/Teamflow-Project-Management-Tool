import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import KanbanBoard from './pages/KanbanBoard'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import MyTasks from './pages/MyTasks'
import Reports from './pages/Reports'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  // Read directly from localStorage so the check is synchronous
  // and not affected by React state batching delays after login
  const token = localStorage.getItem('tf_token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public — always accessible */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route path="/dashboard"           element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/projects"            element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/projects/:id"        element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
      <Route path="/projects/:id/kanban" element={<PrivateRoute><KanbanBoard /></PrivateRoute>} />
      <Route path="/my-tasks"            element={<PrivateRoute><MyTasks /></PrivateRoute>} />
      <Route path="/notifications"       element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/profile"             element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/reports"             element={<PrivateRoute><Reports /></PrivateRoute>} />

      {/* Root redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

