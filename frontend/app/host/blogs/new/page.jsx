"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext.js";
import { Loader2 } from "lucide-react";

// This page redirects to the blog editor in create mode
// We use a separate component to handle the initial state

import HostBlogEditorPage from "../[id]/edit/page";

export default function NewBlogPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
    if (!loading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Render the editor without an ID (create mode)
  return <HostBlogEditorPage />;
}