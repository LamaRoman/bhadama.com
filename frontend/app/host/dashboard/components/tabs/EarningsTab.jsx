"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  DollarSign, TrendingUp, Calendar,
  ArrowUpRight, ArrowDownRight, CreditCard, Wallet,
} from "lucide-react";

const formatCurrency = (v) => `Rs.${(v || 0).toLocaleString()}`;

export default function EarningsTab({ refreshKey }) {
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchEarnings();
  }, [refreshKey, period]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      let bookings = [];
      try {
        const bookingsData = await api("/api/bookings/host");
        console.log("📊 Raw bookings data:", bookingsData);
        bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData.bookings || []);
      } catch (err) {
        console.log("📊 Bookings fetch error:", err);
        bookings = [];
      }
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Filter completed/confirmed bookings
      const completedBookings = bookings.filter(b => 
        b.status === "COMPLETED" || b.status === "CONFIRMED"
      );

      // Use parseFloat since totalPrice is a string
      const getAmount = (b) => parseFloat(b.totalPrice) || 0;

      const total = completedBookings.reduce((sum, b) => sum + getAmount(b), 0);
        
      const thisMonthBookings = completedBookings.filter(b => 
        new Date(b.createdAt) >= thisMonthStart
      );
      const thisMonth = thisMonthBookings.reduce((sum, b) => sum + getAmount(b), 0);

      const lastMonthBookings = completedBookings.filter(b => {
        const date = new Date(b.createdAt);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });
      const lastMonth = lastMonthBookings.reduce((sum, b) => sum + getAmount(b), 0);

      const pending = bookings
        .filter(b => b.status === "PENDING")
        .reduce((sum, b) => sum + getAmount(b), 0);

      setEarnings({
        total,
        thisMonth,
        lastMonth,
        pending,
        transactions: completedBookings.slice(0, 10).map(b => ({
          id: b.id,
          type: "booking",
          amount: getAmount(b),
          description: b.listing?.title || "Booking",
          date: b.createdAt,
          status: b.status,
        })),
      });
    } catch (e) {
      console.error("Failed to fetch earnings:", e);
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const growth = useMemo(() => {
    if (!earnings.lastMonth) return 0;
    return ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1);
  }, [earnings]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
          <p className="text-gray-600">Track your revenue and payouts</p>
        </div>
        <div className="flex items-center gap-2">
          {["week", "month", "year", "all"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                period === p
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "all" ? "All Time" : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Earnings */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <Wallet className="w-8 h-8 opacity-50" />
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(earnings.total)}</div>
          <div className="text-emerald-100">Total Earnings</div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            {parseFloat(growth) >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                {growth}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <ArrowDownRight className="w-4 h-4" />
                {Math.abs(parseFloat(growth))}%
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(earnings.thisMonth)}
          </div>
          <div className="text-gray-600">This Month</div>
        </div>

        {/* Last Month */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(earnings.lastMonth)}
          </div>
          <div className="text-gray-600">Last Month</div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {formatCurrency(earnings.pending)}
          </div>
          <div className="text-gray-600">Pending Payout</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>

        {earnings.transactions?.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {earnings.transactions.map((tx, i) => (
              <div key={tx.id || i} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    tx.type === "payout" ? "bg-green-100" : "bg-blue-100"
                  }`}>
                    {tx.type === "payout" ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    tx.type === "payout" ? "text-green-600" : "text-gray-900"
                  }`}>
                    {tx.type === "payout" ? "-" : "+"}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{tx.status?.toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Payout Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Payout Information</h3>
            <p className="text-gray-600 text-sm">
              Payouts are processed automatically every month. Ensure your bank details are up to date in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}