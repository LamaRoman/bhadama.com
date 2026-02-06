"use client";

import { memo, useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Star } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

// Revenue Chart
const RevenueChart = memo(({ monthlyData = [] }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    if (!monthlyData?.length) {
      return [
        { month: "Jan", revenue: 0 },
        { month: "Feb", revenue: 0 },
        { month: "Mar", revenue: 0 },
      ];
    }
    return monthlyData.map(d => ({
      month: d.month?.slice(0, 3) || "N/A",
      revenue: d.revenue || 0,
    }));
  }, [monthlyData]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
        <TrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      {mounted ? (
        <ResponsiveContainer width="100%" height={256}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`Rs.${value.toLocaleString()}`, "Revenue"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      )}
    </div>
  );
});
RevenueChart.displayName = "RevenueChart";

// Rating Distribution Chart
const RatingDistributionChart = memo(({ reviewsByRating = {} }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    const ratings = reviewsByRating || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    return Object.entries(ratings)
      .map(([rating, count]) => ({ rating: `${rating}★`, count: count || 0 }))
      .reverse();
  }, [reviewsByRating]);

  const hasData = data.some(d => d.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Rating Distribution</h3>
        <Star className="w-5 h-5 text-gray-400" />
      </div>
      {mounted ? (
        hasData ? (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="rating" type="category" tick={{ fontSize: 12 }} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No reviews yet</p>
            </div>
          </div>
        )
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      )}
    </div>
  );
});
RatingDistributionChart.displayName = "RatingDistributionChart";

// Bookings Chart
const BookingsChart = memo(({ monthlyData = [] }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => {
    if (!monthlyData?.length) {
      return [
        { month: "Jan", bookings: 0 },
        { month: "Feb", bookings: 0 },
        { month: "Mar", bookings: 0 },
      ];
    }
    return monthlyData.map(d => ({
      month: d.month?.slice(0, 3) || "N/A",
      bookings: d.bookings || 0,
    }));
  }, [monthlyData]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Bookings Trend</h3>
        <TrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      {mounted ? (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
      )}
    </div>
  );
});
BookingsChart.displayName = "BookingsChart";

// Main Dashboard Charts Component
export default function DashboardCharts({ monthlyData = [], reviewStats = {} }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <RevenueChart monthlyData={monthlyData} />
      <RatingDistributionChart reviewsByRating={reviewStats?.reviewsByRating} />
    </div>
  );
}