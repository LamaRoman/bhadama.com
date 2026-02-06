"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "../../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  DollarSign, TrendingUp, Calendar,
  ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Sun,
} from "lucide-react";

const formatCurrency = (v) => `Rs.${(v || 0).toLocaleString()}`;

export default function EarningsTab({ refreshKey }) {
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    today: 0,  // ✅ ADDED
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
    // ✅ Get everything from stats endpoint (including transactions)
    const statsData = await api("/api/bookings/host/stats");
    
    setEarnings({
      total: statsData.totalRevenue || 0,
      thisMonth: statsData.thisMonthRevenue || 0,
      lastMonth: statsData.lastMonthRevenue || 0,
      today: statsData.todayRevenue || 0,  // ✅ ADDED
      pending: statsData.pendingRevenue || 0,
      transactions: statsData.recentTransactions || [],
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
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

        {/* ✅ ADDED: Today's Earnings */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sun className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{formatCurrency(earnings.today)}</div>
          <div className="text-amber-100">Today's Earnings</div>
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