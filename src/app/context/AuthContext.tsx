import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "../services/api";
import {
  broadcastLogout, clearSession, getSessionUser, onAuthBroadcast, saveSession,
} from "../services/apiClient";
import { clearIdleTimer, useIdleLogout } from "../services/sessionTimeout";

export type UserRole = "member" | "admin" | "staff" | "petugasRak";
export type UserStatus = "active" | "pending" | "inactive" | "blocked";

export interface User {
  id: string;
  namaLengkap: string;
  email: string;
  username?: string;
  nip?: string;
  alamat: string;
  nomorHP?: string;
  jenisAnggota?: string;
  membershipType?: "Umum" | "Pelajar" | "Premium";
  memberCode?: string;
  authToken?: string;
  role: UserRole;
  status: UserStatus;
}

export interface StoredUser extends User { password: string }

export interface RegisterData {
  namaLengkap: string;
  email: string;
  password: string;
  nomorHP: string;
  alamat: string;
  jenisAnggota: string;
}

export interface AdminRegisterData {
  namaLengkap: string;
  email: string;
  username: string;
  password: string;
  role?: "admin" | "staff" | "petugasRak";
  nip: string;
  alamat: string;
  nomorHP?: string;
}

type Result = { success: boolean; message: string; role?: UserRole };
type ApiUser = {
  id: number | string; nama_lengkap: string; email: string; username?: string; nip?: string;
  alamat?: string; nomor_hp?: string; jenis_anggota?: string;
  membership_type?: string; auth_token?: string; role: UserRole; status: UserStatus;
  member_code?: string;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, requiredRole?: "admin" | "member") => Promise<Result>;
  register: (data: RegisterData) => Promise<Result>;
  registerAdmin: (data: AdminRegisterData) => Promise<Result>;
  requestAdminAccess: (data: AdminRegisterData) => Promise<Result>;
  listAdminRequests: () => StoredUser[];
  approveAdminRequest: (id: string) => Result;
  rejectAdminRequest: (id: string) => Result;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  updateProfile: (data: { namaLengkap?: string; nomorHP?: string; alamat?: string }) => Promise<Result>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toUser(raw: ApiUser): User {
  return {
    id: String(raw.id), namaLengkap: raw.nama_lengkap, email: raw.email,
    username: raw.username, nip: raw.nip, alamat: raw.alamat ?? "",
    nomorHP: raw.nomor_hp, jenisAnggota: raw.jenis_anggota,
    membershipType: raw.membership_type as User["membershipType"], memberCode: raw.member_code,
    authToken: raw.auth_token, role: raw.role, status: raw.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSessionUser<User>());

  const saveUser = (nextUser: User) => {
    saveSession(nextUser);
    setUser(nextUser);
  };

  const refreshUser = async () => {
    if (!user?.authToken) return;
    const fresh = await authApi.me();
    if (!fresh) {
      clearSession();
      setUser(null);
      return;
    }
    saveUser({ ...toUser(fresh), authToken: user.authToken });
  };

  const expireSession = async () => {
    const token = user?.authToken;
    if (token) {
      try {
        await Promise.race([
          authApi.logout(),
          new Promise((resolve) => window.setTimeout(resolve, 2000)),
        ]);
      } catch {
        // Abaikan kegagalan jaringan; sesi lokal tetap diakhiri.
      }
    }
    clearIdleTimer();
    clearSession();
    setUser(null);
    broadcastLogout(token);
    window.location.replace("/login?expired=1");
  };

  useIdleLogout(user?.role === "member" && user?.status === "active", expireSession);

  useEffect(() => {
    if (user?.authToken) void refreshUser();
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("perpus:unauthorized", handleUnauthorized);
    const unsubscribe = onAuthBroadcast((msg) => {
      if (msg.type !== "logout" || !msg.token) return;
      const current = getSessionUser<{ authToken?: string }>();
      if (current?.authToken === msg.token) {
        clearSession();
        setUser(null);
      }
    });
    return () => {
      window.removeEventListener("perpus:unauthorized", handleUnauthorized);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string, requiredRole?: "admin" | "member"): Promise<Result> => {
    const result = await authApi.login(email, password, requiredRole);
    if (!result.success || !result.user) {
      return { success: false, message: result.message ?? "Login gagal." };
    }
    const nextUser = toUser(result.user as ApiUser);
    saveUser(nextUser);
    return { success: true, message: result.message ?? "Login berhasil.", role: nextUser.role };
  };

  const register = async (data: RegisterData): Promise<Result> => {
    const result = await authApi.register(data);
    return { success: result.success, message: result.message ?? "Registrasi gagal." };
  };

  const registerAdmin = async (data: AdminRegisterData): Promise<Result> => {
    const result = await authApi.registerAdmin(data);
    if (!result.success || !result.user) {
      return { success: false, message: result.message ?? "Registrasi admin gagal." };
    }
    const nextUser = toUser(result.user as ApiUser);
    saveUser(nextUser);
    return { success: true, message: result.message ?? "Registrasi admin berhasil.", role: nextUser.role };
  };

  const requestAdminAccess = registerAdmin;
  const listAdminRequests = () => [] as StoredUser[];
  const approveAdminRequest = () => ({ success: false, message: "Persetujuan admin belum tersedia di API." });
  const rejectAdminRequest = () => ({ success: false, message: "Penolakan admin belum tersedia di API." });

  const logout = () => {
    const token = user?.authToken;
    void authApi.logout().catch(() => undefined);
    clearIdleTimer();
    clearSession();
    setUser(null);
    broadcastLogout(token);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<Result> => {
    const result = await authApi.changePassword(currentPassword, newPassword);
    return { success: result.success, message: result.message };
  };

  const updateProfile = async (data: { namaLengkap?: string; nomorHP?: string; alamat?: string }): Promise<Result> => {
    if (!user) return { success: false, message: "Sesi tidak ditemukan." };
    const result = await authApi.updateProfile(user.id, {
      nama_lengkap: data.namaLengkap,
      nomor_hp: data.nomorHP,
      alamat: data.alamat,
    });
    if (!result.success) return { success: false, message: result.message || "Gagal menyimpan profil." };
    saveUser({
      ...user,
      namaLengkap: data.namaLengkap ?? user.namaLengkap,
      nomorHP: data.nomorHP ?? user.nomorHP,
      alamat: data.alamat ?? user.alamat,
    });
    return { success: true, message: result.message || "Profil berhasil disimpan." };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user?.status === "active",
        login,
        register,
        registerAdmin,
        requestAdminAccess,
        listAdminRequests,
        approveAdminRequest,
        rejectAdminRequest,
        logout,
        changePassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
