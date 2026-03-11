import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Loading from "./components/Loading.jsx";
import { Toaster } from "./components/ui/toaster.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Lazy load route components
const LandingPage = lazy(() => import("./components/LandingPage.jsx"));
const SuperAdmin = lazy(() => import("./pages/dashboards/SuperAdmin.jsx"));
const Admin = lazy(() => import("./pages/dashboards/Admin.jsx"));
const Sales = lazy(() => import("./pages/dashboards/Sales.jsx"));
const Marketing = lazy(() => import("./pages/dashboards/Marketing.jsx"));
const Customer = lazy(() => import("./pages/dashboards/Customer.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <BrowserRouter>
          <Suspense fallback={<Loading message="Loading Vespera Estates..." />}>
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<LandingPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard/superadmin"
                element={
              
                    <SuperAdmin />
                  
                }
              />

              <Route
                path="/dashboard/admin"
                element={
                
                    <Admin />
                
                }
              />

              <Route
                path="/dashboard/sales"
                element={
                  <ProtectedRoute roles={["sales"]}>
                    <Sales />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/marketing"
                element={
                  <ProtectedRoute roles={["marketing"]}>
                    <Marketing />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/customer"
                element={
                  <ProtectedRoute roles={["customer"]}>
                    <Customer />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
}
