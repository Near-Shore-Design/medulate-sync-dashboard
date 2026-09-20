import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { InstitutionFilterProvider } from "@/contexts/InstitutionFilterContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import CaseReviewPage from "./pages/CaseReviewPage";
import LicensesAccessPage from "./pages/LicensesAccessPage";
import InboxPage from "./pages/InboxPage";
import Unsubscribe from "./pages/Unsubscribe";
import LoginPage from "./pages/LoginPage";
import RegistrationCodesPage from "./pages/RegistrationCodesPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/cases" element={<CaseReviewPage />} />
        <Route path="/licenses" element={<LicensesAccessPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/codes" element={<RegistrationCodesPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

// Administration is for platform admins and institution admins (the page itself
// hides platform-only tabs, and the API enforces scope). Anyone else is bounced.
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_platform_admin && !user?.is_institution_admin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !isLoading && isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      {/* Public: reached from a link in outbound mail, where the
          recipient is not signed in. Must stay outside ProtectedRoutes. */}
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <InstitutionFilterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </InstitutionFilterProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
