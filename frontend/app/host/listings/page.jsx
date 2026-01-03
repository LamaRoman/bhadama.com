"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page redirects to the host dashboard
// The listings are now managed from the dashboard
export default function ListingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/host/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to dashboard...</p>
    </div>
  );
}