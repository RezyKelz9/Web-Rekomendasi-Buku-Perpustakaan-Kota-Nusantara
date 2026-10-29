import type { RegisterData, AdminRegisterData, UserRole, UserStatus } from "../context/AuthContext";
import { apiClient } from "./apiClient";

export type ApiUser = {
  id: number | string;
  nama_lengkap: string;
  email: string;
  username?: string;
  nip?: string;
  alamat?: string;
  nomor_hp?: string;
  jenis_anggota?: string;
  membership_type?: string;
  member_code?: string;
  auth_token?: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
};

type AuthPayload = { user?: ApiUser; data?: ApiUser };

function pickUser(payload: AuthPayload): ApiUser | null {
  return payload.user || payload.data || null;
}

export const authApi = {
  async login(
    email: string,
    password: string,
    requiredRole?: "admin" | "member"
  ): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const res = await apiClient.postPublic<ApiUser>("auth/login.php", {
      email,
      password,
      requiredRole,
    });
    const user = pickUser(res);
    if (res.success && user) {
      return { success: true, message: res.message || "Login berhasil.", user };
    }
    return { success: false, message: res.message || "Email atau password salah." };
  },

  async register(
    data: RegisterData
  ): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const res = await apiClient.postPublic<ApiUser>("auth/register.php", data);
    const user = pickUser(res);
    if (res.success && user) {
      return { success: true, message: res.message || "Registrasi berhasil.", user };
    }
    return { success: false, message: res.message || "Registrasi gagal." };
  },

  async registerAdmin(
    data: AdminRegisterData
  ): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const res = await apiClient.postPublic<ApiUser>("auth/register-admin.php", data);
    const user = pickUser(res);
    if (res.success && user) {
      return { success: true, message: res.message || "Registrasi admin berhasil.", user };
    }
    return { success: false, message: res.message || "Registrasi admin gagal." };
  },

  async me(): Promise<ApiUser | null> {
    const res = await apiClient.get<ApiUser>("auth/me.php");
    return res.success ? pickUser(res) : null;
  },

  async logout(): Promise<void> {
    await apiClient.post("auth/logout.php", {});
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post("auth/change-password.php", {
      currentPassword,
      newPassword,
    });
    return { success: res.success, message: res.message || "Gagal mengubah kata sandi." };
  },

  async updateProfile(
    id: string | number,
    data: Partial<ApiUser>
  ): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const res = await apiClient.put<ApiUser>("users/index.php", { id, ...data });
    return {
      success: res.success,
      message: res.message,
      user: res.data || res.user,
    };
  },

  async fetchUsers(): Promise<ApiUser[]> {
    const res = await apiClient.get<ApiUser[]>("users/index.php");
    return res.success && res.data ? res.data : [];
  },

  async deleteUser(id: number): Promise<boolean> {
    const res = await apiClient.delete("users/index.php", { id });
    return res.success;
  },
};
