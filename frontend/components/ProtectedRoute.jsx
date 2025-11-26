"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const ProtectedRoute = ({ children, user, role }) => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only act if user has finished loading
    if (user === null) return;

    if (!user) {
      router.push("/auth/login");
    } else if (role && user.role !== role) {
      router.push("/auth/login");
    } else {
      setIsReady(true); // User is authorized
    }
  }, [user, role, router]);

  if (!isReady) return null; // Wait until user is known

  return children;
};
