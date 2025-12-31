import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layout/MainLayout";

import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute module="dashboard" action="view">
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requisitions"
        element={
          <ProtectedRoute module="requisition" action="view">
            <MainLayout>
              <div>Requisition List</div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/grn"
        element={
          <ProtectedRoute module="grn" action="view">
            <MainLayout>
              <div>GRN List</div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/consumption"
        element={
          <ProtectedRoute module="consumption" action="view">
            <MainLayout>
              <div>Consumption</div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
