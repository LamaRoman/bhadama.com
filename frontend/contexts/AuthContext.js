"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ Load user from localStorage on mount (only once)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(false);
      }
    } else {
      setUser(false);
    }

    setLoading(false);
  }, []); // ✅ Empty dependency array

  // ✅ Wrap login in useCallback to prevent it from changing on every render
  const login = useCallback((userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);

    // ✅ Redirect based on role
    switch (userData.role) {
      case "ADMIN":
        router.push("/admin/dashboard");
        break;
      case "HOST":
        router.push("/host/dashboard");
        break;
      default:
        router.push("/users/dashboard");
    }
  }, [router]); // ✅ Only depends on router

  // ✅ Wrap logout in useCallback
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(false);
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};