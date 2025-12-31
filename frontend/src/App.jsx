import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";

/* ========= LAYOUTS ========= */
import SuperAdminLayout from "./layouts/SuperAdminLayout.jsx";
import ResortUserLayout from "./layouts/ResortUserLayout.jsx";

/* ========= COMMON ========= */
import Dashboard from "./pages/dashboard/Dashboard";


/* ========= SUPER ADMIN PAGES ========= */
import SuperAdminDashboard from "./pages/superAdmin/Dashboard.jsx";
import SuperRequisitionList from "./pages/superAdmin/RequisitionList.jsx";
import ResortList from "./pages/superAdmin/ResortList.jsx";
import DepartmentList from "./pages/superAdmin/DepartmentList.jsx";
import StoreList from "./pages/superAdmin/StoreList.jsx";
import VendorList from "./pages/superAdmin/VendorList.jsx";
import ItemList from "./pages/superAdmin/ItemList.jsx";
import UserList from "./pages/superAdmin/UserList.jsx";
import POList from "./pages/superAdmin/POList.jsx";
import GRNList from "./pages/superAdmin/GRNList.jsx";
import InventoryOverview from "./pages/superAdmin/InventoryOverview.jsx";
import RecipeMaster from "./pages/superAdmin/RecipeMaster.jsx";
import ItemCategoryMaster from "./pages/superAdmin/ItemCategoryMaster.jsx";
import RecipeCategoryMaster from "./pages/superAdmin/RecipeCategoryMaster.jsx";
import ReportsOverview from "./pages/superAdmin/ReportsOverview.jsx";
import RoleList from "./pages/superAdmin/RoleList.jsx";
import ConsumptionList from "./pages/superAdmin/ConsumptionList.jsx";
import ConsumptionForm from "./pages/superAdmin/ConsumptionForm.jsx";
import StoreReplacement from "./pages/superAdmin/StoreReplacement.jsx";

/* ========= RESORT USER PAGES ========= */
import ResortDashboard from "./pages/resortUser/Dashboard.jsx";
import RequisitionCreate from "./pages/resortUser/RequisitionCreate.jsx";
import ResortRequisitionList from "./pages/resortUser/RequisitionList.jsx";
import POCreate from "./pages/resortUser/POCreate.jsx";
import GRNEntry from "./pages/resortUser/GRNEntry.jsx";
import Reports from "./pages/resortUser/Reports.jsx";

/* ========= ROUTE GUARD ========= */
import ProtectedRoute from "./router/ProtectedRoute.jsx";

const App = () => {
  return (
    <Routes>
      {/* ================= AUTH ================= */}
      <Route path="/login" element={<Login />} />

      {/* ================= COMMON DASHBOARD ================= */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= SUPER ADMIN MODULE ================= */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute module="dashboard" action="view">
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />

        {/* Masters */}
        <Route path="resorts" element={<ResortList />} />
        <Route path="departments" element={<DepartmentList />} />
        <Route path="stores" element={<StoreList />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="items" element={<ItemList />} />
        <Route path="item-categories" element={<ItemCategoryMaster />} />
        <Route path="recipe-categories" element={<RecipeCategoryMaster />} />
        <Route path="recipes" element={<RecipeMaster />} />

        {/* Users & Roles */}
        <Route path="users" element={<UserList />} />
        <Route path="roles" element={<RoleList />} />

        {/* Consumption */}
        <Route path="consumption" element={<ConsumptionList />} />
        <Route path="consumption/new" element={<ConsumptionForm />} />
        <Route path="consumption/:id" element={<ConsumptionForm />} />

        {/* Purchase */}
        <Route path="requisitions" element={<SuperRequisitionList />} />
        <Route path="po" element={<POList />} />
        <Route path="grn" element={<GRNList />} />
        <Route path="store-replacement" element={<StoreReplacement />} />

        {/* Inventory & Reports */}
        <Route path="inventory" element={<InventoryOverview />} />
        <Route path="reports" element={<ReportsOverview />} />
      </Route>

      {/* ================= RESORT USER MODULE ================= */}
      <Route
        path="/resort"
        element={
          <ProtectedRoute module="dashboard" action="view">
            <ResortUserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ResortDashboard />} />
        <Route path="requisitions" element={<ResortRequisitionList />} />
        <Route path="requisitions/create" element={<RequisitionCreate />} />
        <Route path="po" element={<POCreate />} />
        <Route path="grn" element={<GRNEntry />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
