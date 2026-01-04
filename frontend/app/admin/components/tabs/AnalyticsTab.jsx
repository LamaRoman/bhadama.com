"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import { LoadingSpinner, formatCurrency, formatNumber } from "../shared";
import { TrendingUp, DollarSign, Users, Calendar, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AnalyticsTab({ dateRange }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api(`/api/admin/stats?range=${dateRange}`);
      setStats(res);
    } catch (error) { toast.error("Failed to load analytics"); }
    finally { setLoading(false); }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async (type) => {
    try {
      const response = await api(`/api/admin/export/${type}?range=${dateRange}`);
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Exported ${type}`);
    } catch (error) { toast.error(`Failed to export ${type}`); }
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">Platform performance insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('bookings')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" /> Export Bookings
          </button>
          <button onClick={() => handleExport('users')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Download className="w-4 h-4" /> Export Users
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue?.value)}</p>
            </div>
          </div>
          <div className={`text-sm ${(stats?.revenue?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats?.revenue?.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.revenue?.change || 0)}% vs previous
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg"><Calendar className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.bookings?.value)}</p>
            </div>
          </div>
          <div className={`text-sm ${(stats?.bookings?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats?.bookings?.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.bookings?.change || 0)}% vs previous
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg"><Users className="w-6 h-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-600">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.users?.value)}</p>
            </div>
          </div>
          <div className={`text-sm ${(stats?.users?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats?.users?.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.users?.change || 0)}% vs previous
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg"><TrendingUp className="w-6 h-6 text-yellow-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.rating?.value?.toFixed(1) || "0.0"}</p>
            </div>
          </div>
          <div className={`text-sm ${(stats?.rating?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats?.rating?.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.rating?.change || 0)}% vs previous
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chart placeholder - Add Recharts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Status</h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chart placeholder - Add Recharts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}