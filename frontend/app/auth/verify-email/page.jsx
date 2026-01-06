"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../utils/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // Redirect if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/");
    }
  }, [user, router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastIndex = Math.min(index + pastedData.length, 5);
      document.getElementById(`otp-${lastIndex}`)?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const data = await api("/api/verification/email/verify", {
        method: "POST",
        body: { otp: otpString },
      });

      if (data.error) {
        setError(data.error);
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        if (data.locked) {
          setError(`Too many failed attempts. Your account is locked. Please try again later.`);
        }
      } else {
        setMessage("Email verified successfully! Redirecting...");
        
        // Update user in context
        if (updateUser) {
          updateUser({ ...user, emailVerified: true });
        }

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setError("");
    setMessage("");
    setIsResending(true);

    try {
      const data = await api("/api/verification/email/send", {
        method: "POST",
      });

      if (data.error) {
        setError(data.error);
        if (data.remainingSeconds) {
          setCooldown(data.remainingSeconds);
        }
      } else {
        setMessage("Verification code sent! Check your email.");
        setCooldown(60); // 60 second cooldown
        setOtp(["", "", "", "", "", ""]); // Clear inputs
      }
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code to
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {user.email}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-xl shadow border border-gray-200">
          
          {message && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <p className="mt-1 text-xs">
                  {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{" "}
              <button
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                className="font-semibold text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to home
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Check your spam folder if you don't see the email</p>
          <p className="mt-1">The code expires in 10 minutes</p>
        </div>
      </div>
    </div>
  );
}