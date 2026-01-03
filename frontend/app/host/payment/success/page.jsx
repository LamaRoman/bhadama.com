"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { api } from "../../../../utils/api";
import Link from "next/link";
import {
  CheckCircle, Loader2, ArrowRight, Download,
  Calendar, CreditCard, Crown
} from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment");
  const { user, loading: authLoading } = useAuth();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        const data = await api(`/api/payments/${paymentId}`);
        if (!data.error) {
          setPayment(data.payment);
        }
      } catch (error) {
        console.error("Failed to fetch payment:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPayment();
    }
  }, [paymentId, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16">
      <div className="max-w-lg mx-auto px-6">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
            <p className="text-green-100 mt-2">Your subscription is now active</p>
          </div>

          {/* Details */}
          <div className="p-6">
            {payment ? (
              <div className="space-y-4">
                {/* Plan Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Crown className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {payment.subscription?.tier?.displayName} Plan
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.subscription?.billingCycle?.toLowerCase()} subscription
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Amount Paid
                    </span>
                    <span className="font-semibold">
                      {payment.currency === "NPR" ? "Rs." : "$"}
                      {payment.amount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Valid Until
                    </span>
                    <span className="font-semibold">
                      {payment.periodEnd 
                        ? new Date(payment.periodEnd).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })
                        : "N/A"
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-500">
                      {payment.gatewayTransactionId || `PAY-${payment.id}`}
                    </span>
                  </div>
                </div>

                {/* Receipt Note */}
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  <p>A receipt has been sent to your email address.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">Your payment was successful!</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Link
                href="/host/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/host/listings/new"
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
              >
                Create Your First Listing
              </Link>
            </div>
          </div>
        </div>

        {/* Help Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact us at{" "}
          <a href="mailto:support@mybigyard.com" className="text-blue-600 hover:underline">
            support@mybigyard.com
          </a>
        </p>
      </div>
    </div>
  );
}