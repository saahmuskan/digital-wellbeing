import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  deleteUserAccount,
  deleteUserData,
  demoteAdminToUser,
  getAllUsers,
  getCurrentUser,
  getRemovedUsersHistory,
  isAdminRole,
  loginUser as persistLoginUser,
  logoutUser as persistLogoutUser,
  promoteUserToAdmin,
} from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const handleStorage = () => setUser(getCurrentUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(() => ({
    user,
    login: (credentials) => {
      const nextUser = persistLoginUser(credentials);
      setUser(nextUser);
      return nextUser;
    },
    logout: () => {
      persistLogoutUser();
      setUser(null);
    },
    listUsers: () => getAllUsers(),
    promoteToAdmin: (userId) => {
      const next = promoteUserToAdmin(userId);
      setUser(getCurrentUser());
      return next;
    },
    demoteAdmin: (userId) => {
      const next = demoteAdminToUser(userId);
      setUser(getCurrentUser());
      return next;
    },
    deleteUserData: (userId) => {
      const ok = deleteUserData(userId);
      setUser(getCurrentUser());
      return ok;
    },
    deleteUser: (userId) => {
      const ok = deleteUserAccount(userId);
      setUser(getCurrentUser());
      return ok;
    },
    listRemovedUsers: () => getRemovedUsersHistory(),
    isAdmin: () => isAdminRole(getCurrentUser()?.role),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
