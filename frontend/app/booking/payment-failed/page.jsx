"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  MessageCircle,
  AlertTriangle,
  CreditCard,
  Home,
  HelpCircle,
  Phone,
  Mail,
  ShieldX
} from "lucide-react";

export default function BookingPaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const bookingId = searchParams.get("bookingId");
  const gateway = searchParams.get("gateway");

  const getErrorInfo = () => {
    switch (error) {
      case "booking_not_found":
        return {
          title: "Booking Not Found",
          message: "We couldn't find this booking. It may have expired or been cancelled.",
          icon: HelpCircle,
          color: "amber",
        };
      case "payment_cancelled":
        return {
          title: "Payment Cancelled",
          message: "You cancelled the payment. Don't worry, no charges were made to your account.",
          icon: XCircle,
          color: "gray",
        };
      case "insufficient_balance":
        return {
          title: "Insufficient Balance",
          message: "Your wallet doesn't have enough balance. Please add funds and try again.",
          icon: CreditCard,
          color: "amber",
        };
      case "callback_error":
        return {
          title: "Processing Error",
          message: "There was an error processing your payment confirmation. Please check your payment app to verify.",
          icon: AlertTriangle,
          color: "amber",
        };
      case "verification_failed":
        return {
          title: "Verification Failed",
          message: "We couldn't verify your payment with the payment provider. If money was deducted, please contact support.",
          icon: ShieldX,
          color: "red",
        };
      default:
        return {
          title: "Payment Failed",
          message: "Something went wrong with your payment. Please try again or use a different payment method.",
          icon: XCircle,
          color: "red",
        };
    }
  };

  const errorInfo = getErrorInfo();
  const IconComponent = errorInfo.icon;

  const colorClasses = {
    red: {
      bg: "from-red-500 to-rose-500",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      alertBg: "bg-red-50",
      alertBorder: "border-red-100",
      alertText: "text-red-700",
    },
    amber: {
      bg: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-500",
      alertBg: "bg-amber-50",
      alertBorder: "border-amber-100",
      alertText: "text-amber-700",
    },
    gray: {
      bg: "from-gray-500 to-slate-500",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
      alertBg: "bg-gray-50",
      alertBorder: "border-gray-200",
      alertText: "text-gray-700",
    },
  };

  const colors = colorClasses[errorInfo.color];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-red-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className={`relative bg-gradient-to-r ${colors.bg} p-8 text-center overflow-hidden`}>
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <IconComponent className={`w-10 h-10 ${colors.iconColor}`} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{errorInfo.title}</h1>
                <p className="text-white/80">No charges were made to your account</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error Message */}
              <div className={`${colors.alertBg} border ${colors.alertBorder} rounded-2xl p-4 mb-6`}>
                <p className={`${colors.alertText}`}>{errorInfo.message}</p>
                {gateway && (
                  <p className={`text-sm ${colors.alertText} opacity-70 mt-2`}>
                    Payment method: {gateway.charAt(0).toUpperCase() + gateway.slice(1).toLowerCase()}
                  </p>
                )}
                {bookingId && bookingId !== "unknown" && (
                  <p className={`text-sm ${colors.alertText} opacity-70 mt-1`}>
                    Booking ID: {bookingId}
                  </p>
                )}
              </div>

              {/* Troubleshooting Tips */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                  What you can try:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 font-bold text-xs">1</span>
                    </div>
                    <span>Check if you have sufficient balance in your wallet</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 font-bold text-xs">2</span>
                    </div>
                    <span>Ensure your payment account is active and verified</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 font-bold text-xs">3</span>
                    </div>
                    <span>Try using a different payment method (eSewa, Khalti, or Card)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-600 font-bold text-xs">4</span>
                    </div>
                    <span>Check your internet connection and try again</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => router.back()}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>

                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Browse Other Spaces
                </Link>

                <Link
                  href="/users/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 transition-all"
                >
                  <Home className="w-5 h-5" />
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-5 mt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  If the problem persists or money was deducted, our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:support@mybigyard.com"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    support@mybigyard.com
                  </a>
                  <a
                    href="tel:+977-XXXXXXXXXX"
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    +977-XXXXXXXXXX
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Money Deducted Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Money deducted but booking failed?</p>
                <p className="text-sm text-amber-700 mt-1">
                  In rare cases, payment may be deducted but booking fails. The amount will be automatically refunded within 24-48 hours. If not, please contact support with your transaction details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}