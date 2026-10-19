import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { initLoanSync } from "./utils/loanUtils";
import { authApi } from "./services/api";

function AppInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initLoanSync();
    authApi.fetchUsers();
  }, []);
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInit>
        <RouterProvider router={router} />
      </AppInit>
    </AuthProvider>
  );
}
