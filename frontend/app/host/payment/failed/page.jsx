"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const gateway = searchParams.get("gateway");

  const getErrorMessage = () => {
    switch (error) {
      case "payment_not_found":
        return "We couldn't find this payment. Please try again.";
      case "payment_cancelled":
        return "You cancelled the payment. No charges were made.";
      case "payment_failed":
        return "The payment could not be processed. Please try again.";
      case "callback_error":
        return "There was an error processing your payment confirmation.";
      default:
        return "Something went wrong with your payment. Please try again.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-16">
      <div className="max-w-lg mx-auto px-6">
        {/* Failed Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
            <p className="text-red-100 mt-2">Don't worry, no charges were made</p>
          </div>

          {/* Details */}
          <div className="p-6">
            {/* Error Message */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-red-700">{getErrorMessage()}</p>
              {gateway && (
                <p className="text-sm text-red-500 mt-2">
                  Gateway: {gateway.toUpperCase()}
                </p>
              )}
            </div>

            {/* What to do */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What you can do:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Check if you have sufficient balance in your wallet
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Ensure your payment method is active and not expired
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Try using a different payment method
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Contact your bank if the issue persists
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>

              <Link
                href="/host/select-tier"
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Choose Different Plan
              </Link>

              <Link
                href="/host/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 transition-all"
              >
                Continue with Free Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Help Note */}
        <div className="bg-white rounded-xl border p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Need help?</p>
              <p className="text-sm text-gray-600 mt-1">
                If you continue to face issues, please contact our support team at{" "}
                <a href="mailto:support@mybigyard.com" className="text-blue-600 hover:underline">
                  support@mybigyard.com
                </a>
                {" "}or call us at <strong>+977-XXXXXXXXXX</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}