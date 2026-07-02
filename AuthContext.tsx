import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  namaLengkap: string;
  email: string;
  nomorHP: string;
  alamat: string;
  jenisAnggota: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; message: string };
  register: (data: RegisterData) => { success: boolean; message: string };
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => { success: boolean; message: string };
}

export interface RegisterData {
  namaLengkap: string;
  email: string;
  password: string;
  nomorHP: string;
  alamat: string;
  jenisAnggota: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "perpus_users";
const SESSION_KEY = "perpus_session";

function loadUsers(): (RegisterData & { id: string })[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: (RegisterData & { id: string })[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = user !== null;

  const login = (email: string, password: string) => {
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, message: "Email atau password salah." };
    }
    const sessionUser: User = {
      id: found.id,
      namaLengkap: found.namaLengkap,
      email: found.email,
      nomorHP: found.nomorHP,
      alamat: found.alamat,
      jenisAnggota: found.jenisAnggota,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true, message: "Login berhasil!" };
  };

  const register = (data: RegisterData) => {
    const users = loadUsers();
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (emailExists) {
      return { success: false, message: "Email sudah terdaftar. Silakan login." };
    }
    const newUser = { ...data, id: `USR-${Date.now()}` };
    saveUsers([...users, newUser]);
    return { success: true, message: "Registrasi berhasil! Silakan login." };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const changePassword = (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, message: "Sesi tidak ditemukan." };
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { success: false, message: "Akun tidak ditemukan." };
    if (users[idx].password !== currentPassword) {
      return { success: false, message: "Kata sandi lama tidak sesuai." };
    }
    users[idx].password = newPassword;
    saveUsers(users);
    return { success: true, message: "Kata sandi berhasil diubah." };
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
