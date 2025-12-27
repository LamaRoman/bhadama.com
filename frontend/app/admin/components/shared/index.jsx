"use client";

import { memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// ============== UTILITY FUNCTIONS ==============

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ============== STAT CARD ==============

export const StatCard = memo(({ title, value, change = 0, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
});
StatCard.displayName = 'StatCard';

// ============== STATUS BADGE ==============

export const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    CONFIRMED: { color: "bg-green-100 text-green-800", label: "Confirmed" },
    PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    CANCELLED: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    COMPLETED: { color: "bg-blue-100 text-blue-800", label: "Completed" },
    ACTIVE: { color: "bg-green-100 text-green-800", label: "Active" },
    INACTIVE: { color: "bg-gray-100 text-gray-800", label: "Inactive" },
    SUSPENDED: { color: "bg-red-100 text-red-800", label: "Suspended" },
    REJECTED: { color: "bg-red-100 text-red-800", label: "Rejected" },
    APPROVED: { color: "bg-green-100 text-green-800", label: "Approved" },
  };

  const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status || "Unknown" };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

// ============== STAR RATING ==============

export const StarRating = memo(({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
));
StarRating.displayName = 'StarRating';

// ============== LOADING SPINNER ==============

export const LoadingSpinner = memo(({ message = "Loading..." }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
));
LoadingSpinner.displayName = 'LoadingSpinner';

// ============== EMPTY STATE ==============

export const EmptyState = memo(({ icon: Icon, title, description }) => (
  <div className="text-center py-12">
    <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

// ============== ACTION BUTTON ==============

export const ActionButton = memo(({ onClick, icon: Icon, label, variant = "default", size = "sm" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    primary: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    success: "bg-green-100 text-green-800 hover:bg-green-200",
    danger: "bg-red-100 text-red-800 hover:bg-red-200",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      onClick={onClick}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-colors inline-flex items-center gap-1`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
});
ActionButton.displayName = 'ActionButton';