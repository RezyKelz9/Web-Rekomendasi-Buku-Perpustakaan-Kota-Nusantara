import { createContext, useContext, useState, ReactNode } from "react";
import { authApi } from "../services/api";

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
  membership_type?: User["membershipType"]; auth_token?: string; role: UserRole; status: UserStatus;
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
  changePassword: (currentPassword: string, newPassword: string) => Result;
}

const AuthContext = createContext<AuthContextType | null>(null);
const SESSION_KEY = "perpus_session";

function toUser(raw: ApiUser): User {
  return {
    id: String(raw.id), namaLengkap: raw.nama_lengkap, email: raw.email,
    username: raw.username, nip: raw.nip, alamat: raw.alamat ?? "",
    nomorHP: raw.nomor_hp, jenisAnggota: raw.jenis_anggota,
    membershipType: raw.membership_type, memberCode: raw.member_code,
    authToken: raw.auth_token, role: raw.role, status: raw.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const saveSession = (nextUser: User) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const login = async (email: string, password: string, requiredRole?: "admin" | "member"): Promise<Result> => {
    const result = await authApi.login(email, password, requiredRole);
    if (!result.success || !result.user) return { success: false, message: result.message ?? "Login gagal." };
    const nextUser = toUser(result.user as ApiUser);
    saveSession(nextUser);
    return { success: true, message: result.message ?? "Login berhasil.", role: nextUser.role };
  };

  const register = async (data: RegisterData): Promise<Result> => {
    const result = await authApi.register(data);
    return { success: result.success, message: result.message ?? "Registrasi gagal." };
  };

  const registerAdmin = async (data: AdminRegisterData): Promise<Result> => {
    const result = await authApi.registerAdmin(data);
    if (!result.success || !result.user) return { success: false, message: result.message ?? "Registrasi admin gagal." };
    saveSession(toUser(result.user as ApiUser));
    return { success: true, message: result.message ?? "Registrasi admin berhasil.", role: "admin" };
  };

  const requestAdminAccess = registerAdmin;
  const listAdminRequests = () => [] as StoredUser[];
  const approveAdminRequest = () => ({ success: false, message: "Persetujuan admin belum tersedia di API." });
  const rejectAdminRequest = () => ({ success: false, message: "Penolakan admin belum tersedia di API." });
  const logout = () => { localStorage.removeItem(SESSION_KEY); setUser(null); };
  const changePassword = () => ({ success: false, message: "Ubah password belum tersedia di API." });

  return <AuthContext.Provider value={{ user, isAuthenticated: user?.status === "active", login, register, registerAdmin, requestAdminAccess, listAdminRequests, approveAdminRequest, rejectAdminRequest, logout, changePassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
