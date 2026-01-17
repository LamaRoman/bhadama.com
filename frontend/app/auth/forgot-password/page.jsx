"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, RateLimitError } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  const { forgotPassword } = useAuth();

  // Countdown timer for rate limiting
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      const timer = setTimeout(() => {
        setRateLimitSeconds(rateLimitSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rateLimitSeconds > 0) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);

      // Handle rate limiting
      if (err instanceof RateLimitError || err.code === "RATE_LIMIT_EXCEEDED") {
        const retryAfter = err.retryAfter || 3600; // Default 1 hour for password reset
        setRateLimitSeconds(retryAfter);
        setError(`Too many attempts. Please wait ${formatTime(retryAfter)} before trying again.`);
      } else if (err.userMessage) {
        setError(err.userMessage);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link will expire in 1 hour. Check your spam folder if you don't see it.
            </p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Back to Login
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Rate limit countdown warning */}
        {rateLimitSeconds > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Rate limit reached
                </p>
                <p className="text-sm text-amber-700">
                  Try again in <span className="font-mono font-bold">{formatTime(rateLimitSeconds)}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                required
                disabled={rateLimitSeconds > 0}
              />
            </div>

            <button
              type="submit"
              disabled={loading || rateLimitSeconds > 0}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                loading || rateLimitSeconds > 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : rateLimitSeconds > 0 ? (
                `Wait ${formatTime(rateLimitSeconds)}`
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          For security, password reset requests are limited to 3 per hour.
        </p>
      </div>
    </div>
  );
}