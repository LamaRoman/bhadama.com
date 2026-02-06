"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth, RateLimitError, getErrorMessage } from "../../../contexts/AuthContext.js";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SocialLoginButtons from "../../../components/SocialLoginButtons";

function LoginContent() {
  const { login, user, sessionError, clearSessionError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle OAuth errors from URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages = {
        google_auth_failed: "Google sign-in failed. Please try again.",
        auth_failed: "Authentication failed. Please try again.",
        invalid_callback: "Invalid login attempt. Please try again.",
      };
      setError(errorMessages[errorParam] || "Login failed. Please try again.");
    }
  }, [searchParams]);

  // Handle session errors (e.g., token expired)
  useEffect(() => {
    if (sessionError) {
      const messages = {
        SESSION_EXPIRED: "Your session has expired. Please log in again.",
        TOKEN_REFRESH_FAILED: "Session expired. Please log in again.",
      };
      setError(messages[sessionError] || "Please log in again.");
      clearSessionError();
    }
  }, [sessionError, clearSessionError]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && errorCode === "RATE_LIMIT") {
      // Clear rate limit error when countdown ends
      setError("");
      setErrorCode(null);
    }
  }, [countdown, errorCode]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect") || "/";
      console.log("✅ User logged in, redirecting to:", redirect);
      router.replace(redirect);
    }
  }, [user, router, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorCode(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    // Don't submit if rate limited
    if (countdown > 0) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      
      // Redirect after successful login
      const redirect = searchParams.get('redirect');
      router.push(redirect || "/");
    } catch (error) {
      console.error("Login error:", error);

      // Handle rate limit error with countdown
      if (error instanceof RateLimitError || error.code === "LOGIN_RATE_LIMIT") {
        const retryAfter = error.retryAfter || 900; // 15 minutes default
        setCountdown(retryAfter);
        setErrorCode("RATE_LIMIT");
        setError(`Too many login attempts. Please try again in ${formatTime(retryAfter)}.`);
      } 
      // Handle account locked
      else if (error.code === "ACCOUNT_LOCKED") {
        setErrorCode("ACCOUNT_LOCKED");
        setError(error.message || "Your account is temporarily locked. Please try again later.");
      }
      // Handle account suspended
      else if (error.code === "ACCOUNT_SUSPENDED") {
        setErrorCode("ACCOUNT_SUSPENDED");
        setError("Your account has been suspended. Please contact support.");
      }
      // Handle other errors
      else {
        setError(error.userMessage || error.message || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} seconds`;
  };

  // Don't render form if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">    

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Google Login */}
          <SocialLoginButtons role="USER" />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className={`px-4 py-3 rounded-xl flex items-start ${
                errorCode === "RATE_LIMIT" 
                  ? "bg-orange-50 border border-orange-200 text-orange-700"
                  : errorCode === "ACCOUNT_SUSPENDED"
                  ? "bg-red-100 border border-red-300 text-red-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p>{error}</p>
                  {countdown > 0 && (
                    <p className="mt-1 text-sm font-medium">
                      Try again in: {formatTime(countdown)}
                    </p>
                  )}
                  {errorCode === "ACCOUNT_SUSPENDED" && (
                    <Link href="/support" className="mt-2 inline-block text-sm underline">
                      Contact Support
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || countdown > 0}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || countdown > 0}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading || countdown > 0}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || countdown > 0}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed ${
                countdown > 0 
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : countdown > 0 ? (
                `Try again in ${formatTime(countdown)}`
              ) : (
                'Sign in'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register/user" className="font-semibold text-blue-600 hover:text-blue-500">
                Create one now
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-700">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}