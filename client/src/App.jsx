import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import BusinessesPage from "./pages/BusinessesPage.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ModulePage from "./pages/ModulePage.jsx";
import TeamPage from "./pages/TeamPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route
        path="/businesses"
        element={
          <ProtectedRoute>
            <BusinessesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:businessId/setup"
        element={
          <ProtectedRoute>
            <SetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:businessId/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:businessId/module/:moduleId"
        element={
          <ProtectedRoute>
            <ModulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:businessId/team"
        element={
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business/:businessId/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/businesses" replace />} />
      <Route path="*" element={<Navigate to="/businesses" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
