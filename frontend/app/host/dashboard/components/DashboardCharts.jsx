"use client";

import { memo, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DollarSign, TrendingUp, Star, MessageSquare } from "lucide-react";

const RATING_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const ChartCard = memo(({ title, subtitle, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{subtitle}</p>
      </div>
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <div className="h-64">{children}</div>
  </div>
));
ChartCard.displayName = "ChartCard";

const RevenueChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={v => `$${v / 1000}k`} />
      <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
    </LineChart>
  </ResponsiveContainer>
));
RevenueChart.displayName = "RevenueChart";

const OccupancyChart = memo(({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
      <YAxis stroke="#6b7280" fontSize={12} tickFormatter={v => `${v}%`} />
      <Tooltip formatter={v => [`${v}%`, 'Occupancy']} />
      <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
));
OccupancyChart.displayName = "OccupancyChart";

const RatingDistributionChart = memo(({ reviewsByRating }) => {
  const data = useMemo(() => 
    Object.entries(reviewsByRating)
      .map(([rating, count]) => ({ rating: `${rating}★`, count }))
      .filter(item => item.count > 0)
      .reverse(),
    [reviewsByRating]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis type="number" stroke="#6b7280" fontSize={12} />
        <YAxis type="category" dataKey="rating" stroke="#6b7280" fontSize={12} width={40} />
        <Tooltip formatter={v => [v, 'Reviews']} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={RATING_COLORS[i % RATING_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
RatingDistributionChart.displayName = "RatingDistributionChart";

const ReviewSummaryCard = memo(({ reviewStats, pendingCount }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-bold text-gray-900">Review Summary</h3>
      <MessageSquare className="w-6 h-6 text-gray-400" />
    </div>
    <div className="space-y-4">
      {[
        { label: "Average Rating", value: reviewStats.averageRating.toFixed(1), bg: "bg-blue-50", color: "text-blue-600" },
        { label: "Response Rate", value: `${reviewStats.responseRate.toFixed(0)}%`, bg: "bg-green-50", color: "text-green-600" },
        { label: "Pending Responses", value: pendingCount, bg: "bg-amber-50", color: "text-amber-600" },
        { label: "Positive Reviews", value: reviewStats.positiveReviews, bg: "bg-purple-50", color: "text-purple-600" },
      ].map(({ label, value, bg, color }) => (
        <div key={label} className={`flex justify-between items-center p-3 ${bg} rounded-lg`}>
          <span className="text-gray-700">{label}</span>
          <span className={`font-bold ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  </div>
));
ReviewSummaryCard.displayName = "ReviewSummaryCard";

export default function DashboardCharts({ monthlyData, reviewStats, reviews = [] }) {
  const revenueData = useMemo(() => monthlyData.slice(0, 6), [monthlyData]);
  const occupancyData = useMemo(() => 
    monthlyData.slice(0, 6).map(({ month, occupancy }) => ({ month, occupancy })),
    [monthlyData]
  );
  const pendingCount = useMemo(() => reviews.filter(r => !r.hostResponse).length, [reviews]);

  return (
    <>
      {/* Revenue & Occupancy Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Revenue Trend" subtitle="Last 6 months performance" icon={DollarSign}>
          <RevenueChart data={revenueData} />
        </ChartCard>
        <ChartCard title="Occupancy Rate" subtitle="Monthly occupancy percentage" icon={TrendingUp}>
          <OccupancyChart data={occupancyData} />
        </ChartCard>
      </div>

      {/* Rating Distribution & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ChartCard title="Rating Distribution" subtitle="Breakdown of guest ratings" icon={Star}>
            <RatingDistributionChart reviewsByRating={reviewStats.reviewsByRating} />
          </ChartCard>
        </div>
        <ReviewSummaryCard reviewStats={reviewStats} pendingCount={pendingCount} />
      </div>
    </>
  );
}