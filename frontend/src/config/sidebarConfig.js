export const SIDEBAR_ITEMS = [
  /* ================= MASTERS ================= */
  {
    section: "Masters",
    items: [
      { label: "Users", path: "/users", module: "USERS" },
      { label: "Roles", path: "/roles", module: "ROLES" },
      { label: "Resorts", path: "/resorts", module: "RESORTS" },
      { label: "Stores", path: "/stores", module: "STORES" },
      { label: "Vendors", path: "/vendors", module: "VENDORS" },
      { label: "Items", path: "/items", module: "ITEMS" },
    ],
  },

  /* ================= PURCHASE ================= */
  {
    section: "Purchase",
    items: [
      { label: "Requisitions", path: "/requisitions", module: "REQUISTITIONS" },
      { label: "Purchase Orders", path: "/po", module: "PO" },
      { label: "GRN", path: "/grn", module: "GRN" },
      { label: "Consumption", path: "/consumption", module: "CONSUMPTION" },
      {
        label: "Store Replacement",
        path: "/store-replacement",
        module: "STORE_REPLACEMENT",
      },
    ],
  },

  /* ================= REPORTS ================= */
  {
    section: "Reports",
    items: [
      { label: "Reports", path: "/reports", module: "REPORTS" },
    ],
  },
];
