"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const [user, setUser] = useState(null); // null = loading, false = no user
  const router = useRouter();

  // Load user from localStorage on first render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(false);
      }
    } else {
      setUser(false); // no user found
    }
  }, []);

  const login = (userData, token) => {
    if (!userData || !userData.role) {
      console.error("Login failed: invalid userData", userData);
      return;
    }

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);

    router.push(getRedirectedPath(userData.role));
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(false);
    router.push("/auth/login");
  };

  const getRedirectedPath = (role) => {
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "HOST":
        return "/host/dashboard";
      case "USER":
        return "/"
      default:
        return "/";
    }
  };

  return { user, login, logout };
};
