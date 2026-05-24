import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Loading from "./components/Loading.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const SuperAdmin = lazy(() => import("./pages/dashboards/SuperAdmin.jsx"));
const Admin = lazy(() => import("./pages/dashboards/Admin.jsx"));
const Sales = lazy(() => import("./pages/dashboards/Sales.jsx"));
const Marketing = lazy(() => import("./pages/dashboards/Marketing.jsx"));
const Customer = lazy(() => import("./pages/dashboards/Customer.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-black">
          <BrowserRouter>
            <Suspense fallback={<Loading message="Loading Vespera Estates..." />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/dashboard/superadmin"
                  element={
                    <ProtectedRoute permission="canManageUsers">
                      <SuperAdmin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/admin/*"
                  element={
                    <ProtectedRoute permission="canViewDashboard">
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/sales"
                  element={
                    <ProtectedRoute permission="canViewDashboard">
                      <Sales />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/marketing"
                  element={
                    <ProtectedRoute permission="canViewDashboard">
                      <Marketing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/customer"
                  element={
                    <ProtectedRoute permission="canViewDashboard">
                      <Customer />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
