import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, LoginPage, RegisterPage } from "@/features/auth";
import { TicketPage } from "@/features/tickets";
import { DashboardPage } from "@/features/projects";
import { GanttPage } from "@/features/gantt";
import { CalendarPage } from "@/features/calendar";
import { SettingsPage } from "@/features/settings";
import { UserProfilePage } from "@/features/users";
import { AdminPage } from "@/features/admin";
import { Layout, ProtectedRoute } from "@/shared/components";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>{<DashboardPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>{<TicketPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/gantt"
            element={
              <ProtectedRoute>
                <Layout>{<GanttPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>{<CalendarPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>{<SettingsPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>{<UserProfilePage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>{<AdminPage />}</Layout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
