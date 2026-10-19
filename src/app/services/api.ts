import type { RegisterData, AdminRegisterData, UserRole, UserStatus } from "../context/AuthContext";
import { apiClient, checkBackend } from "./apiClient";

type ApiUser = {
  id: number | string;
  password?: string;
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
};

const USERS_KEY = "perpus_users";

function loadUsers(): ApiUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: ApiUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function initializeUsers() {
  const users = loadUsers();
  if (users.length === 0) {
    const defaultUsers: ApiUser[] = [
      {
        id: "USR-ADMIN",
        nama_lengkap: "Admin Perpustakaan",
        email: "admin@perpus.local",
        password: "admin123",
        username: "admin",
        nomor_hp: "081234567890",
        alamat: "Kantor Perpustakaan",
        jenis_anggota: "SuperAdmin",
        member_code: "ADM-0001",
        role: "admin",
        status: "active",
      },
      {
        id: "USR-MEMBER",
        nama_lengkap: "Anggota Contoh",
        email: "member@perpus.local",
        password: "member123",
        nomor_hp: "081234567891",
        alamat: "Jl. Anggrek No. 12",
        jenis_anggota: "Umum",
        member_code: "UMM-0001",
        role: "member",
        status: "active",
      },
    ];
    saveUsers(defaultUsers);
  }
}

initializeUsers();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authApi = {
  async login(email: string, password: string, requiredRole?: "admin" | "member"): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const backendUp = await checkBackend();
    if (backendUp) {
      const res = await apiClient.postPublic<ApiUser>("auth/login.php", { email, password, requiredRole });
      if (res.success && res.data) {
        const local = loadUsers();
        const idx = local.findIndex((u) => u.email === email);
        const entry = { ...res.data };
        if (idx >= 0) local[idx] = entry;
        else local.push(entry);
        saveUsers(local);
        return { success: true, message: "Login berhasil!", user: res.data };
      }
      return { success: false, message: res.message || "Email atau password salah." };
    }

    await delay(400);
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { success: false, message: "Email atau password salah." };
    if (found.status !== "active") {
      return {
        success: false,
        message:
          found.status === "blocked"
            ? "Akun Anda diblokir. Hubungi admin."
            : found.status === "pending"
            ? "Akun Anda masih menunggu approval."
            : "Akun Anda dinonaktifkan.",
      };
    }
    if (requiredRole === "admin" && found.role !== "admin") {
      return { success: false, message: "Akun ini bukan administrator. Gunakan portal anggota untuk masuk." };
    }
    if (requiredRole === "member" && found.role === "admin") {
      return { success: false, message: "Gunakan portal administrasi untuk masuk." };
    }
    const u = { ...found };
    return { success: true, message: "Login berhasil!", user: u };
  },

  async register(data: RegisterData): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const backendUp = await checkBackend();
    if (backendUp) {
      const res = await apiClient.postPublic<ApiUser>("auth/register.php", data);
      if (res.success && res.data) {
        const local = loadUsers();
        local.push({ ...res.data });
        saveUsers(local);
        return { success: true, message: "Registrasi berhasil! Silakan login.", user: res.data };
      }
      return { success: false, message: res.message || "Registrasi gagal." };
    }

    await delay(400);
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: "Email sudah terdaftar. Silakan login." };
    }
    const prefixMap: Record<string, string> = { Umum: "UMM", Pelajar: "PLJ", "Dosen/Pengajar": "DOS" };
    const prefix = prefixMap[data.jenisAnggota] || "UMM";
    const locals = loadUsers().filter((u) => u.member_code?.startsWith(prefix + "-"));
    const maxSeq = Math.max(0, ...locals.map((u) => parseInt((u.member_code ?? "").slice(4), 10)).filter((n) => !isNaN(n)));
    const memberCode = `${prefix}-${String(maxSeq + 1).padStart(4, "0")}`;
    const newUser: ApiUser = {
      id: `USR-${Date.now()}`,
      password: data.password,
      nama_lengkap: data.namaLengkap,
      email: data.email,
      nomor_hp: data.nomorHP,
      alamat: data.alamat,
      jenis_anggota: data.jenisAnggota,
      member_code: memberCode,
      role: "member",
      status: "active",
    };
    saveUsers([...users, newUser]);
    return { success: true, message: "Registrasi berhasil! Silakan login.", user: newUser };
  },

  async registerAdmin(data: AdminRegisterData): Promise<{ success: boolean; message?: string; user?: ApiUser }> {
    const backendUp = await checkBackend();
    if (backendUp) {
      const res = await apiClient.postPublic<ApiUser>("auth/register-admin.php", data);
      if (res.success && res.data) {
        const local = loadUsers();
        local.push({ ...res.data });
        saveUsers(local);
        return { success: true, message: "Registrasi admin berhasil!", user: res.data };
      }
      return { success: false, message: res.message || "Registrasi admin gagal." };
    }

    await delay(400);
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: "Email sudah terdaftar. Silakan login atau gunakan email lain." };
    }
    const adminPrefix = "ADM";
    const localAdmins = loadUsers().filter((u) => u.member_code?.startsWith(adminPrefix + "-"));
    const maxAdminSeq = Math.max(0, ...localAdmins.map((u) => parseInt((u.member_code ?? "").slice(4), 10)).filter((n) => !isNaN(n)));
    const adminCode = `${adminPrefix}-${String(maxAdminSeq + 1).padStart(4, "0")}`;
    const newUser: ApiUser = {
      id: `ADM-${Date.now()}`,
      nama_lengkap: data.namaLengkap,
      email: data.email,
      username: data.username,
      nip: data.nip,
      alamat: data.alamat,
      nomor_hp: data.nomorHP,
      member_code: adminCode,
      role: data.role || "admin",
      status: "active",
    };
    saveUsers([...users, newUser]);
    return { success: true, message: "Permintaan akses admin berhasil dikirim. Akun akan aktif setelah disetujui.", user: newUser };
  },

  async fetchUsers(): Promise<ApiUser[]> {
    const backendUp = await checkBackend();
    if (backendUp) {
      const res = await apiClient.get<ApiUser[]>("users/index.php");
      if (res.success && res.data) {
        saveUsers(res.data);
        return res.data;
      }
    }
    return loadUsers();
  },

  async deleteUser(id: number): Promise<boolean> {
    const backendUp = await checkBackend();
    if (backendUp) {
      const res = await apiClient.delete("users/index.php", { id });
      if (res.success) {
        const local = loadUsers().filter((u) => u.id !== id);
        saveUsers(local);
      }
      return res.success;
    }
    const local = loadUsers().filter((u) => u.id !== id);
    saveUsers(local);
    return true;
  },

  loadUsers(): ApiUser[] {
    return loadUsers();
  },

  saveUsers(users: ApiUser[]) {
    saveUsers(users);
  },
};
