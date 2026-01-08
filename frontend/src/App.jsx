import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login.jsx";

import SuperAdminLayout from "./layouts/SuperAdminLayout.jsx";
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

const App = () => {
  return (
    <Routes>
      {/* ✅ ROOT FIX – app open hote hi dashboard */}
      <Route path="/" element={<Navigate to="/super-admin/dashboard" replace />} />

      {/* ✅ LOGIN (manual only, no auto redirect) */}
      <Route path="/login" element={<Login />} />

      {/* ✅ SUPER ADMIN MODULE */}
      <Route path="/super-admin" element={<SuperAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />

        {/* Masters */}
        <Route path="resorts" element={<ResortList />} />
        <Route path="departments" element={<DepartmentList />} />
        <Route path="stores" element={<StoreList />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="items" element={<ItemList />} />
        <Route path="users" element={<UserList />} />
        <Route path="roles" element={<RoleList />} />

        {/* Purchase */}
        <Route path="requisitions" element={<SuperRequisitionList />} />
        <Route path="po" element={<POList />} />
        <Route path="grn" element={<GRNList />} />

        {/* Inventory & Others */}
        <Route path="inventory" element={<InventoryOverview />} />
        <Route path="recipes" element={<RecipeMaster />} />
        <Route path="item-categories" element={<ItemCategoryMaster />} />
        <Route path="recipe-categories" element={<RecipeCategoryMaster />} />
        <Route path="reports" element={<ReportsOverview />} />
        <Route path="consumption" element={<ConsumptionList />} />
        <Route path="consumption/new" element={<ConsumptionForm />} />
        <Route path="consumption/:id" element={<ConsumptionForm />} />
        <Route path="store-replacement" element={<StoreReplacement />} />
      </Route>

      {/* ✅ FALLBACK – WHITE SCREEN FIX */}
      <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
    </Routes>
  );
};

export default App;
