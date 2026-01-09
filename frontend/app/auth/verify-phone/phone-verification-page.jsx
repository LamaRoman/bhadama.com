"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import { toast, Toaster } from "react-hot-toast";
import PhoneInput from "@/components/PhoneInput";
import {
  Phone,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

export default function PhoneVerificationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState("phone"); // "phone" or "otp"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState("");

  // Check if already verified
  useEffect(() => {
    if (user?.phoneVerified) {
      toast.success("Phone already verified!");
      router.push("/users/dashboard");
    }
  }, [user, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await api("/api/verification/phone/send", {
        method: "POST",
        body: { phoneNumber },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Verification code sent!");
      setMaskedPhone(response.maskedPhone || phoneNumber);
      setStep("otp");
      setResendCooldown(60);
    } catch (error) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled or next empty
      const nextIndex = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    } else {
      // Single digit
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  // Handle OTP keydown (backspace)
  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await api("/api/verification/phone/verify", {
        method: "POST",
        body: { otp: otpString },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Phone verified successfully!");
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      // Redirect
      setTimeout(() => {
        router.push("/users/dashboard");
      }, 1000);
    } catch (error) {
      toast.error(error.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const response = await api("/api/verification/phone/send", {
        method: "POST",
        body: { phoneNumber },
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("New code sent!");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {step === "phone" ? "Verify Your Phone" : "Enter Verification Code"}
          </h1>
          <p className="text-stone-600 mt-2">
            {step === "phone"
              ? "We'll send you a verification code"
              : `We sent a code to ${maskedPhone}`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-200/50 border border-white/50 p-8">
          {step === "phone" ? (
            /* STEP 1: Phone Number Input */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Phone Number
                </label>
                
                {/* ✅ Using PhoneInput component with auto country code */}
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  userCountry={user?.country || "NP"}
                  error={null}
                />
                
                <p className="text-xs text-stone-500 mt-2">
                  Enter your local number without the country code
                </p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* STEP 2: OTP Input */
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change number
              </button>

              {/* OTP Input boxes */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-stone-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Verify Phone
                  </>
                )}
              </button>

              {/* Resend */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-stone-500 text-sm">
                    Resend code in <span className="font-bold text-emerald-600">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 p-4 bg-stone-50 rounded-xl">
            <Shield className="w-5 h-5 text-stone-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-500">
              Your phone number is used for account security and booking confirmations. 
              We'll never share it with third parties.
            </p>
          </div>
        </div>

        {/* Skip link (if phone verification is optional) */}
        {user?.role === "USER" && (
          <p className="text-center mt-6">
            <button
              onClick={() => router.push("/users/dashboard")}
              className="text-stone-500 hover:text-stone-700 text-sm"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  );
}