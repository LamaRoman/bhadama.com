"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Use useLayoutEffect on client, useEffect on server (SSR safety)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * ProtectedRoute - Wraps pages that require authentication
 * 
 * PREVENTS flash of content by:
 * 1. Starting with "checking" state (shows nothing/loader)
 * 2. Only rendering children when explicitly "authorized"
 * 3. Using useLayoutEffect for synchronous checks before paint
 * 
 * Usage (New API):
 * ```jsx
 * <ProtectedRoute allowedRoles={["HOST", "ADMIN"]}>
 *   <HostDashboard />
 * </ProtectedRoute>
 * ```
 * 
 * Usage (Legacy API - backward compatible):
 * ```jsx
 * <ProtectedRoute user={user} role="ADMIN">
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 */
function ProtectedRouteInner({ 
  children, 
  allowedRoles = null,  // New API: array of roles
  role = null,          // Legacy API: single role string (backward compatible)
  user: userProp = null, // Legacy API: user prop (ignored, we use useAuth)
  redirectTo = "/auth/login",
  fallback = null
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Explicit states: "checking" | "authorized" | "redirecting"
  // Start as "checking" - NEVER render content until we verify
  const [authState, setAuthState] = useState("checking");

  // Normalize roles: support both `role="ADMIN"` and `allowedRoles={["ADMIN"]}`
  const normalizedRoles = allowedRoles || (role ? [role] : null);

  // Use layoutEffect to run BEFORE browser paints - prevents flash
  useIsomorphicLayoutEffect(() => {
    // Still loading auth state from storage/context
    if (loading) {
      setAuthState("checking");
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      setAuthState("redirecting");
      console.log("🔒 ProtectedRoute: Not authenticated, redirecting to login");
      sessionStorage.setItem("redirectAfterLogin", pathname);
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role restrictions if specified
    if (normalizedRoles && normalizedRoles.length > 0) {
      const userRole = user.role || user.userType || "USER";
      
      if (!normalizedRoles.includes(userRole)) {
        setAuthState("redirecting");
        console.log(`🔒 ProtectedRoute: Role "${userRole}" not in allowed roles:`, normalizedRoles);
        
        // Redirect to appropriate page based on role
        if (userRole === "HOST") {
          router.replace("/host/dashboard");
        } else if (userRole === "ADMIN") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/");
        }
        return;
      }
    }

    // All checks passed - NOW we can show content
    setAuthState("authorized");
  }, [user, loading, isAuthenticated, normalizedRoles, router, pathname, redirectTo]);

  // NEVER render children unless explicitly authorized
  if (authState !== "authorized") {
    if (fallback) return fallback;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-stone-600 text-sm">
            {authState === "redirecting" ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}

// Named export for backward compatibility: import { ProtectedRoute } from "..."
export { ProtectedRouteInner as ProtectedRoute };

// Default export for new usage: import ProtectedRoute from "..."
export default ProtectedRouteInner;

/**
 * PublicRoute - Wraps pages that should NOT be accessible when logged in
 * (like login/register pages - redirects to dashboard if already authenticated)
 * 
 * PREVENTS flash of content for logged-in users visiting auth pages
 * 
 * Usage:
 * ```jsx
 * import { PublicRoute } from "@/components/ProtectedRoute";
 * 
 * export default function LoginPage() {
 *   return (
 *     <PublicRoute>
 *       <LoginForm />
 *     </PublicRoute>
 *   );
 * }
 * ```
 */
export function PublicRoute({ 
  children, 
  redirectTo = null  // null = auto-detect based on role
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Explicit states: "checking" | "allowed" | "redirecting"
  const [authState, setAuthState] = useState("checking");

  useIsomorphicLayoutEffect(() => {
    if (loading) {
      setAuthState("checking");
      return;
    }

    if (isAuthenticated && user) {
      setAuthState("redirecting");
      console.log("🔓 PublicRoute: Already authenticated, redirecting...");
      
      // Check for stored redirect destination
      const storedRedirect = sessionStorage.getItem("redirectAfterLogin");
      if (storedRedirect) {
        sessionStorage.removeItem("redirectAfterLogin");
        router.replace(storedRedirect);
        return;
      }

      // Auto-detect redirect based on role
      const destination = redirectTo || getDefaultRedirect(user);
      router.replace(destination);
      return;
    }

    // Not authenticated - allow access to public page
    setAuthState("allowed");
  }, [user, loading, isAuthenticated, router, redirectTo]);

  // Don't render until we've verified auth state
  if (authState !== "allowed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return children;
}

/**
 * Helper: Get default redirect path based on user role
 */
function getDefaultRedirect(user) {
  const role = user?.role || user?.userType || "USER";
  
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "HOST":
      return "/host/dashboard";
    default:
      return "/";
  }
}

/**
 * HOC version for wrapping entire page components
 * 
 * Usage:
 * ```jsx
 * function DashboardPage() {
 *   return <div>Dashboard</div>;
 * }
 * 
 * export default withAuth(DashboardPage);
 * // or with role restriction:
 * export default withAuth(DashboardPage, { allowedRoles: ["HOST"] });
 * ```
 */
export function withAuth(Component, options = {}) {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRouteInner {...options}>
        <Component {...props} />
      </ProtectedRouteInner>
    );
  };
}

/**
 * HOC for public-only routes
 */
export function withPublicOnly(Component, options = {}) {
  return function PublicOnlyComponent(props) {
    return (
      <PublicRoute {...options}>
        <Component {...props} />
      </PublicRoute>
    );
  };
}