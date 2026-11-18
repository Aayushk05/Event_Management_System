import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import Login     from "./pages/auth/Login";
import Register  from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";

// Participant
import ParticipantDashboard from "./pages/participant/Dashboard";
import BrowseEvents         from "./pages/participant/BrowseEvents";
import EventDetail          from "./pages/participant/EventDetail";
import Clubs                from "./pages/participant/Clubs";
import ClubDetail           from "./pages/participant/ClubDetail";
import ParticipantProfile   from "./pages/participant/Profile";

// Organizer
import OrganizerDashboard  from "./pages/organizer/Dashboard";
import CreateEvent         from "./pages/organizer/CreateEvent";
import OrganizerEventDetail from "./pages/organizer/EventDetail";
import OrganizerProfile    from "./pages/organizer/Profile";

// Admin
import AdminDashboard        from "./pages/admin/Dashboard";
import ManageOrganizers      from "./pages/admin/ManageOrganizers";
import PasswordResetRequests from "./pages/admin/PasswordResetRequests";

// Role-based root redirect
const RootRedirect = () => {
  const { user, isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role === "organizer") return <Navigate to="/organizer/dashboard" replace />;
  if (user?.role === "admin")     return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <div className="min-h-screen bg-bg-base font-body">
      <Navbar />
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth - public only */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={
          <ProtectedRoute roles={["participant"]}>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute roles={["participant"]}>
            <ParticipantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/events" element={
          <ProtectedRoute roles={["participant"]}>
            <BrowseEvents />
          </ProtectedRoute>
        } />
        <Route path="/events/:id" element={
          <ProtectedRoute roles={["participant"]}>
            <EventDetail />
          </ProtectedRoute>
        } />
        <Route path="/clubs" element={
          <ProtectedRoute roles={["participant"]}>
            <Clubs />
          </ProtectedRoute>
        } />
        <Route path="/clubs/:id" element={
          <ProtectedRoute roles={["participant"]}>
            <ClubDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute roles={["participant"]}>
            <ParticipantProfile />
          </ProtectedRoute>
        } />
        <Route path="/organizer/dashboard" element={
          <ProtectedRoute roles={["organizer"]}>
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/organizer/events/create" element={
          <ProtectedRoute roles={["organizer"]}>
            <CreateEvent />
          </ProtectedRoute>
        } />
        <Route path="/organizer/events/edit/:id" element={
          <ProtectedRoute roles={["organizer"]}>
            <CreateEvent />
          </ProtectedRoute>
        } />
        <Route path="/organizer/events/:id" element={
          <ProtectedRoute roles={["organizer"]}>
            <OrganizerEventDetail />
          </ProtectedRoute>
        } />
        <Route path="/organizer/profile" element={
          <ProtectedRoute roles={["organizer"]}>
            <OrganizerProfile />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/organizers" element={
          <ProtectedRoute roles={["admin"]}>
            <ManageOrganizers />
          </ProtectedRoute>
        } />
        <Route path="/admin/password-reset-requests" element={
          <ProtectedRoute roles={["admin"]}>
            <PasswordResetRequests />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={
          <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
            <p className="text-6xl font-display font-bold text-bg-border">404</p>
            <p className="text-slate-400 font-body">Page not found.</p>
            <a href="/" className="btn-primary text-sm">Go Home</a>
          </div>
        } />
      </Routes>
    </div>
  );
};

export default App;
