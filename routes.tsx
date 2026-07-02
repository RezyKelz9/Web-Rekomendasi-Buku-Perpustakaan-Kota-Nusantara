import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Books } from "./pages/Books";
import { Shelves } from "./pages/Shelves";
import { Categories } from "./pages/Categories";
import { LoanInfo } from "./pages/LoanInfo";
import { Account } from "./pages/Account";

export const router = createBrowserRouter([
  // Public-only routes (redirect to "/" if already logged in)
  {
    Component: PublicOnlyRoute,
    children: [
      { path: "/login", Component: Login },
      { path: "/register", Component: Register },
    ],
  },
  // Protected routes
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
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
  // Fallback
  { path: "*", element: <Navigate to="/login" replace /> },
]);
