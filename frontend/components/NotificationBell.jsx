"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, X, Loader2 } from "lucide-react";
import { api } from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useNotifications } from "@/contexts/NotificationContext";

// Notification type icons and colors
const NOTIFICATION_STYLES = {
  BOOKING_CREATED: { icon: "📅", color: "bg-blue-100 text-blue-600" },
  BOOKING_CONFIRMED: { icon: "✅", color: "bg-green-100 text-green-600" },
  BOOKING_CANCELLED: { icon: "❌", color: "bg-red-100 text-red-600" },
  BOOKING_REMINDER: { icon: "⏰", color: "bg-orange-100 text-orange-600" },
  BOOKING_COMPLETED: { icon: "🎉", color: "bg-green-100 text-green-600" },
  NEW_BOOKING_REQUEST: { icon: "📥", color: "bg-blue-100 text-blue-600" },
  PAYMENT_RECEIVED: { icon: "💰", color: "bg-green-100 text-green-600" },
  PAYMENT_FAILED: { icon: "⚠️", color: "bg-red-100 text-red-600" },
  NEW_REVIEW: { icon: "⭐", color: "bg-yellow-100 text-yellow-600" },
  MESSAGE: { icon: "💬", color: "bg-blue-100 text-blue-600" },
  SUBSCRIPTION_EXPIRING: { icon: "⚠️", color: "bg-orange-100 text-orange-600" },
  SUBSCRIPTION_EXPIRED: { icon: "❌", color: "bg-red-100 text-red-600" },
  LISTING_APPROVED: { icon: "✅", color: "bg-green-100 text-green-600" },
  LISTING_REJECTED: { icon: "❌", color: "bg-red-100 text-red-600" },
  BLOG_APPROVED: { icon: "📝", color: "bg-green-100 text-green-600" },
  BLOG_COMMENT: { icon: "💬", color: "bg-blue-100 text-blue-600" },
  BLOG_LIKE: { icon: "❤️", color: "bg-pink-100 text-pink-600" },
  WELCOME: { icon: "👋", color: "bg-purple-100 text-purple-600" },
  SYSTEM: { icon: "ℹ️", color: "bg-gray-100 text-gray-600" },
  DEFAULT: { icon: "🔔", color: "bg-gray-100 text-gray-600" },
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api("/api/notifications/unread-count");
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api("/api/notifications?limit=10");
      if (response.success) {
        setNotifications(response.notifications);
        setHasMore(response.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationStyle = (type) => {
    return NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.DEFAULT;
  };

  const getNotificationUrl = (notification) => {
    if (notification.actionUrl) return notification.actionUrl;
    
    // Generate URL based on type and data
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-stone-500">
                <Bell className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const url = getNotificationUrl(notification);
                
                const Content = (
                  <div
                    className={`px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-emerald-50/50" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (!url) setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.color}`}
                      >
                        <span className="text-lg">{style.icon}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            notification.read
                              ? "text-stone-600"
                              : "text-stone-900 font-medium"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-stone-500 truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );

                return url ? (
                  <Link
                    key={notification.id}
                    href={url}
                    onClick={() => setIsOpen(false)}
                  >
                    {Content}
                  </Link>
                ) : (
                  <div key={notification.id}>{Content}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-stone-100">
              <Link
                href="/notifications"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}