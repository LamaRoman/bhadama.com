"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Loader2, 
  Filter,
  ChevronDown 
} from "lucide-react";
import { api } from "@/utils/api";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

// Notification type icons and colors
const NOTIFICATION_STYLES = {
  BOOKING_CREATED: { icon: "📅", color: "bg-blue-100 text-blue-600", label: "Booking" },
  BOOKING_CONFIRMED: { icon: "✅", color: "bg-green-100 text-green-600", label: "Booking" },
  BOOKING_CANCELLED: { icon: "❌", color: "bg-red-100 text-red-600", label: "Booking" },
  BOOKING_REMINDER: { icon: "⏰", color: "bg-orange-100 text-orange-600", label: "Reminder" },
  BOOKING_COMPLETED: { icon: "🎉", color: "bg-green-100 text-green-600", label: "Booking" },
  NEW_BOOKING_REQUEST: { icon: "📥", color: "bg-blue-100 text-blue-600", label: "Booking" },
  PAYMENT_RECEIVED: { icon: "💰", color: "bg-green-100 text-green-600", label: "Payment" },
  PAYMENT_FAILED: { icon: "⚠️", color: "bg-red-100 text-red-600", label: "Payment" },
  NEW_REVIEW: { icon: "⭐", color: "bg-yellow-100 text-yellow-600", label: "Review" },
  MESSAGE: { icon: "💬", color: "bg-blue-100 text-blue-600", label: "Message" },
  SUBSCRIPTION_EXPIRING: { icon: "⚠️", color: "bg-orange-100 text-orange-600", label: "Subscription" },
  SUBSCRIPTION_EXPIRED: { icon: "❌", color: "bg-red-100 text-red-600", label: "Subscription" },
  LISTING_APPROVED: { icon: "✅", color: "bg-green-100 text-green-600", label: "Listing" },
  LISTING_REJECTED: { icon: "❌", color: "bg-red-100 text-red-600", label: "Listing" },
  BLOG_APPROVED: { icon: "📝", color: "bg-green-100 text-green-600", label: "Blog" },
  BLOG_COMMENT: { icon: "💬", color: "bg-blue-100 text-blue-600", label: "Blog" },
  BLOG_LIKE: { icon: "❤️", color: "bg-pink-100 text-pink-600", label: "Blog" },
  WELCOME: { icon: "👋", color: "bg-purple-100 text-purple-600", label: "Welcome" },
  SYSTEM: { icon: "ℹ️", color: "bg-gray-100 text-gray-600", label: "System" },
  DEFAULT: { icon: "🔔", color: "bg-gray-100 text-gray-600", label: "Notification" },
};

const FILTER_OPTIONS = [
  { value: null, label: "All Notifications" },
  { value: "unread", label: "Unread Only" },
  { value: "BOOKING", label: "Bookings" },
  { value: "PAYMENT", label: "Payments" },
  { value: "MESSAGE", label: "Messages" },
  { value: "REVIEW", label: "Reviews" },
  { value: "SYSTEM", label: "System" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    fetchNotifications(true);
  }, [filter]);

  const fetchNotifications = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      let url = `/api/notifications?limit=${LIMIT}&offset=${currentOffset}`;
      
      if (filter === "unread") {
        url += "&unreadOnly=true";
      } else if (filter) {
        // Filter by type prefix (BOOKING, PAYMENT, etc.)
        url += `&typePrefix=${filter}`;
      }

      const response = await api(url);
      
      if (response.success) {
        if (reset) {
          setNotifications(response.notifications);
        } else {
          setNotifications((prev) => [...prev, ...response.notifications]);
        }
        setHasMore(response.hasMore);
        setTotal(response.total);
        setOffset(currentOffset + response.notifications.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date() } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const archiveNotification = async (id) => {
    try {
      await api(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => prev - 1);
    } catch (error) {
      console.error("Failed to archive notification:", error);
    }
  };

  const getNotificationStyle = (type) => {
    return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.DEFAULT;
  };

  const getNotificationUrl = (notification) => {
    if (notification.actionUrl) return notification.actionUrl;
    
    const data = notification.data || {};
    switch (notification.type) {
      case "BOOKING_CREATED":
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
      case "BOOKING_REMINDER":
      case "NEW_BOOKING_REQUEST":
        return data.bookingId ? `/bookings/${data.bookingId}` : "/bookings";
      case "NEW_REVIEW":
        return data.listingId ? `/listings/${data.listingId}#reviews` : "/reviews";
      case "MESSAGE":
        return "/messages";
      case "LISTING_APPROVED":
      case "LISTING_REJECTED":
        return data.listingId ? `/listings/${data.listingId}` : "/dashboard/listings";
      case "BLOG_APPROVED":
      case "BLOG_COMMENT":
      case "BLOG_LIKE":
        return data.blogId ? `/blog/${data.blogSlug || data.blogId}` : "/blog";
      case "SUBSCRIPTION_EXPIRING":
      case "SUBSCRIPTION_EXPIRED":
        return "/dashboard/subscription";
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
            <p className="text-stone-500 mt-1">
              {total} total • {unreadCount} unread
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <Filter className="w-4 h-4 text-stone-500" />
                <span className="text-sm text-stone-700">
                  {FILTER_OPTIONS.find((f) => f.value === filter)?.label || "Filter"}
                </span>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-10">
                  {FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value || "all"}
                      onClick={() => {
                        setFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-stone-50 ${
                        filter === option.value
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-stone-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mark All Read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-stone-200" />
              <h3 className="text-lg font-medium text-stone-900 mb-2">
                No notifications
              </h3>
              <p className="text-stone-500">
                {filter ? "No notifications match this filter" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const url = getNotificationUrl(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-stone-50 transition-colors ${
                      !notification.read ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.color}`}
                      >
                        <span className="text-xl">{style.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${style.color} mb-1 inline-block`}>
                              {style.label}
                            </span>
                            <h4
                              className={`text-sm ${
                                notification.read
                                  ? "text-stone-700"
                                  : "text-stone-900 font-semibold"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <p className="text-sm text-stone-500 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-stone-400 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                              {" • "}
                              {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => archiveNotification(notification.id)}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Action Link */}
                        {url && (
                          <Link
                            href={url}
                            onClick={() => {
                              if (!notification.read) markAsRead(notification.id);
                            }}
                            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-3"
                          >
                            View details →
                          </Link>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => fetchNotifications(false)}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Load more notifications"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}