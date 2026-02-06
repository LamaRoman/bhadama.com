"use client";
import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOAuth } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent running multiple times
    if (hasProcessed.current) return;

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const emailVerified = searchParams.get("emailVerified");
    const phoneVerified = searchParams.get("phoneVerified");
    const error = searchParams.get("error");

    console.log("🔍 Callback URL params:", {
      token: token ? "present" : "missing",
      userId,
      name,
      email,
      role,
      emailVerified, // This should be the string "true" or "false"
      phoneVerified,
      error
    });

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      router.push(`/auth/login?error=${error}`);
      return;
    }

    // Handle successful authentication
    if (token && userId) {
      hasProcessed.current = true;

      // Create user object with all fields
      const user = {
        id: parseInt(userId),
        name: decodeURIComponent(name || ""),
        email: decodeURIComponent(email || ""),
        role: role || "USER",
        emailVerified: emailVerified === "true", // ✅ Convert string to boolean
        phoneVerified: phoneVerified === "true", // ✅ Convert string to boolean
      };

      console.log("✅ Google OAuth Success - User object:", user);
      console.log("✅ emailVerified value:", emailVerified, "converted to:", user.emailVerified);

      // Use loginWithOAuth for OAuth flow
      loginWithOAuth(user, token);

      // Redirect based on role
      setTimeout(() => {
        if (role === "HOST") {
          console.log("🏠 Redirecting to host dashboard");
          router.push("/host/dashboard");
        } else {
          console.log("👤 Redirecting to home");
          router.push("/");
        }
      }, 500); // Small delay to ensure login completes
    } else {
      console.error("Missing token or userId in callback");
      router.push("/auth/login?error=invalid_callback");
    }
  }, [searchParams, router, loginWithOAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Signing you in...</h2>
        <p className="text-gray-500 mt-2">Please wait while we complete your login.</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
