"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext.js"; // Adjust path as needed

export const ProtectedRoute = ({ children, role }) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // user is `false` when not logged in, or an object when logged in
    if (!user) {
      router.push("/auth/login");
    } else if (role && user.role !== role) {
      router.push("/auth/login");
    } else {
      setIsReady(true);
    }
  }, [user, loading, role, router]);

  // Show nothing while auth is loading or checking
  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return children;
};