"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../utils/api";
import { toast, Toaster } from "react-hot-toast";
import {
  CreditCard, Loader2, ArrowLeft, Check, X,
  Clock, Download, Filter, ChevronLeft, ChevronRight
} from "lucide-react";

const STATUS_CONFIG = {
  COMPLETED: { color: "bg-green-100 text-green-700", icon: Check },
  PENDING: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  FAILED: { color: "bg-red-100 text-red-700", icon: X },
  REFUNDED: { color: "bg-purple-100 text-purple-700", icon: CreditCard },
  CANCELLED: { color: "bg-gray-100 text-gray-700", icon: X },
};

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    fetchPayments();
  }, [pagination.page, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = `/api/payments/history?page=${pagination.page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const data = await api(url);
      if (!data.error) {
        setPayments(data.payments || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
              <p className="text-gray-600">View all your transactions</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : payments.length > 0 ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="divide-y">
              {payments.map((payment) => {
                const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={payment.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusConfig.color}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {payment.currency === "NPR" ? "Rs." : "$"}
                          {payment.amount?.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm text-gray-500">
                      <div>
                        <span className="text-gray-400">Gateway:</span>{" "}
                        <span className="font-medium">{payment.gateway}</span>
                      </div>
                      {payment.gatewayTransactionId && (
                        <div>
                          <span className="text-gray-400">Transaction:</span>{" "}
                          <span className="font-mono text-xs">{payment.gatewayTransactionId}</span>
                        </div>
                      )}
                      {payment.subscription?.tier && (
                        <div>
                          <span className="text-gray-400">Plan:</span>{" "}
                          <span className="font-medium">{payment.subscription.tier.displayName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * 10 + 1} - {Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Payments Yet</h3>
            <p className="text-gray-500 mt-2">
              Your payment history will appear here after you make a purchase.
            </p>
            <button
              onClick={() => router.push("/host/select-tier")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Plans
            </button>
          </div>
        )}

        {/* Export Note */}
        {payments.length > 0 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto">
              <Download className="w-4 h-4" />
              Download as CSV (Coming Soon)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}