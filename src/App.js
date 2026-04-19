import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AssessmentPage from "./pages/AssessmentPage";
import DashboardPage from "./pages/DashboardPage";
import AppointmentPage from "./pages/AppoinmentPage";
import BlogPage from "./pages/Blogpage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminBookedSlotsPage from "./pages/AdminBookedSlotsPage";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { isAdminRole } from "./utils/auth";
import "./styles/main.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return isAdminRole(user.role) ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

function AppShell() {
  const { user } = useAuth();

  return (
    <div className={user ? "app-shell has-mobile-bottom-nav" : "app-shell"}>
      {user ? <Navbar /> : null}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/appointment" element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>} />
        <Route path="/blog" element={<ProtectedRoute><BlogPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/booked-slots" element={<AdminRoute><AdminBookedSlotsPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
      {user ? <Chatbot /> : null}
    </div>
  );
}

export default App;