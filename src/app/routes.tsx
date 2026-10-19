import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute, PublicOnlyRoute, MemberRoute, AdminRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { LoginAdmin } from "./pages/LoginAdmin";
import { Register } from "./pages/user/Register";
import { SelectRole } from "./pages/user/SelectRole";
import { Dashboard } from "./pages/user/Dashboard";
import { Books } from "./pages/user/Books";
import { Shelves } from "./pages/user/Shelves";
import { Categories } from "./pages/user/Categories";
import { LoanInfo } from "./pages/user/LoanInfo";
import { Account } from "./pages/user/Account";
import { Payment } from "./pages/Payment";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { RegisterAdmin } from "./pages/admin/RegisterAdmin";
import { AdminBooks } from "./pages/admin/Books";
import { AdminMembers } from "./pages/admin/Members";
import { AdminLoans } from "./pages/admin/Loans";
import { AdminShelves } from "./pages/admin/Shelves";
import { AdminCategories } from "./pages/admin/Categories";
import { AdminReports } from "./pages/admin/Reports";
import { AdminSettings } from "./pages/admin/Settings";
import { AdminHistory } from "./pages/admin/History";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/select-role" replace /> },
  { path: "/payment/:loanId", Component: Payment },
  // Public-only routes (redirect to the correct area if already logged in)
  {
    Component: PublicOnlyRoute,
    children: [
      { path: "/select-role", Component: SelectRole },
      { path: "/login", Component: Login },
      { path: "/login-admin", Component: LoginAdmin },
      { path: "/register", Component: Register },
      { path: "/register-admin", Component: RegisterAdmin },
    ],
  },
  // Protected routes for user and admin
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/user",
        Component: MemberRoute,
        children: [
          {
            path: "",
            Component: Layout,
            children: [
              { index: true, Component: Dashboard },
              { path: "books", Component: Books },
              { path: "shelves", Component: Shelves },
              { path: "categories", Component: Categories },
              { path: "loan-info", Component: LoanInfo },
              { path: "account", Component: Account },
            ],
          },
        ],
      },
      {
        path: "admin",
        Component: AdminRoute,
        children: [
          {
            path: "",
            Component: AdminLayout,
            children: [
              { index: true, Component: AdminDashboard },
              { path: "books", Component: AdminBooks },
              { path: "members", Component: AdminMembers },
              { path: "loans", Component: AdminLoans },
              { path: "shelves", Component: AdminShelves },
              { path: "categories", Component: AdminCategories },
              { path: "reports", Component: AdminReports },
              { path: "settings", Component: AdminSettings },
              { path: "history", Component: AdminHistory },
            ],
          },
        ],
      },
    ],
  },
  // Fallback
  { path: "*", element: <Navigate to="/select-role" replace /> },
]);
