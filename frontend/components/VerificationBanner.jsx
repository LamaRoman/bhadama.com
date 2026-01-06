"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function VerificationBanner() {
  const router = useRouter();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("verificationBannerDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      setIsVisible(false);
    }
  }, []);

  // Don't show if user is not logged in or is verified or banner was dismissed
  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("verificationBannerDismissed", "true");
  };

  const handleVerify = () => {
    router.push("/auth/verify-email");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 border-b border-orange-600">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center flex-1">
            <span className="flex p-2 rounded-lg bg-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                <span className="hidden md:inline">
                  Your email is not verified. Please verify your email to unlock all features and make bookings.
                </span>
                <span className="md:hidden">
                  Email not verified. Verify to make bookings.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={handleVerify}
              className="px-4 py-2 bg-white text-orange-600 text-sm font-semibold rounded-lg hover:bg-orange-50 transition-colors"
            >
              Verify Now
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}