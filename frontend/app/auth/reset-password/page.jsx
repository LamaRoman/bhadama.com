"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getErrorMessage } from "../../../utils/api";

function ResetPasswordContent() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      setError("Invalid reset link");
      setLoading(false);
      return;
    }

    setToken(tokenFromUrl);
    verifyToken(tokenFromUrl);
  }, [searchParams]);

  // Update password strength as user types
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const verifyToken = async (resetToken) => {
    try {
      const response = await api(`/api/auth/reset-password/${resetToken}`);
      
      if (response.valid) {
        setValidToken(true);
        setEmail(response.email);
      } else {
        setError("This reset link is invalid or has expired");
      }
    } catch (err) {
      console.error(err);
      // Handle specific error codes
      if (err.code === "TOKEN_EXPIRED") {
        setError("This reset link has expired. Please request a new one.");
      } else if (err.code === "INVALID_TOKEN") {
        setError("This reset link is invalid. Please request a new one.");
      } else {
        setError(getErrorMessage(err) || "Failed to verify reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 8) {
      return "Password must be at least 8 characters long";
    }

    if (trimmedPassword.length > 128) {
      return "Password must be less than 128 characters";
    }

    if (!/[a-z]/.test(trimmedPassword)) {
      return "Password must contain at least one lowercase letter";
    }

    if (!/[A-Z]/.test(trimmedPassword)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/[0-9]/.test(trimmedPassword)) {
      return "Password must contain at least one number";
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(trimmedPassword)) {
      return "Password must contain at least one special character";
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate password
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const response = await api("/api/auth/reset-password", {
        method: "POST",
        body: {
          token,
          newPassword: password.trim(),
          confirmPassword: confirmPassword.trim(),
        },
      });

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      
      // Handle specific error codes
      if (err.code === "TOKEN_EXPIRED") {
        setError("This reset link has expired. Please request a new one.");
        setValidToken(false);
      } else if (err.code === "VALIDATION_ERROR") {
        setError(err.message || "Please check your password requirements.");
      } else {
        setError(getErrorMessage(err) || "Failed to reset password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. Redirecting to login...
            </p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/auth/forgot-password"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Enter your new password for {email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicators */}
              <div className="mt-3 space-y-1">
                <div className={`flex items-center text-xs ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                  <span className="mr-2">{passwordStrength.hasMinLength ? "✓" : "○"}</span>
                  At least 8 characters
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.hasLowercase ? "text-green-600" : "text-gray-500"}`}>
                  <span className="mr-2">{passwordStrength.hasLowercase ? "✓" : "○"}</span>
                  One lowercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.hasUppercase ? "text-green-600" : "text-gray-500"}`}>
                  <span className="mr-2">{passwordStrength.hasUppercase ? "✓" : "○"}</span>
                  One uppercase letter
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                  <span className="mr-2">{passwordStrength.hasNumber ? "✓" : "○"}</span>
                  One number
                </div>
                <div className={`flex items-center text-xs ${passwordStrength.hasSpecial ? "text-green-600" : "text-gray-500"}`}>
                  <span className="mr-2">{passwordStrength.hasSpecial ? "✓" : "○"}</span>
                  One special character (!@#$%^&*)
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                required
              />
              {confirmPassword && password === confirmPassword && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <span className="mr-1">✓</span> Passwords match
                </p>
              )}
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="mr-1">✗</span> Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                submitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}