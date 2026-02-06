"use client";
import { useState, useEffect } from "react";
import { api } from "../../../../../utils/api.js";
import { toast } from "react-hot-toast";
import {
  Calendar, Eye, X, Check, Clock, MapPin,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";

const formatCurrency = (v) => `Rs.${(v || 0).toLocaleString()}`;

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

// Pagination Component
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  
  return (
    <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </button>
      <span className="text-gray-500">Page {current} of {total}</span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function BookingsTab({ refreshKey }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    revenue: 0,
  });

  // Fetch bookings with server-side pagination
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const data = await api(`/api/bookings/host/all?${params.toString()}`);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      
      // Update stats if provided by backend
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch bookings:", e);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats separately (optional - if backend doesn't provide in main response)
  const fetchStats = async () => {
    try {
      const data = await api("/api/bookings/host/stats");
      setStats({
        total: data.totalBookings || 0,
        pending: data.pendingBookings || 0,
        confirmed: data.confirmedBookings || 0,
        completed: data.completedBookings || 0,
        revenue: data.totalRevenue || 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [refreshKey]);

  // Refetch when page or filter changes
  useEffect(() => {
    fetchBookings();
  }, [pagination.page, statusFilter]);

  const handleConfirm = async (bookingId) => {
    try {
      await api(`/api/bookings/${bookingId}/confirm`, { method: "PATCH" });
      toast.success("Booking confirmed!");
      fetchBookings(); // Refetch to get updated data
      fetchStats(); // Update stats
    } catch (e) {
      toast.error("Failed to confirm booking");
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await api(`/api/bookings/${bookingId}/reject`, { method: "PATCH" });
      toast.success("Booking cancelled");
      fetchBookings(); // Refetch to get updated data
      fetchStats(); // Update stats
    } catch (e) {
      toast.error("Failed to cancel booking");
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filtering
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
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
          <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
          <p className="text-gray-600">Manage your venue bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-700">{stats.confirmed}</div>
          <div className="text-sm text-green-600">Confirmed</div>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="text-3xl font-bold text-blue-700">{stats.completed}</div>
          <div className="text-sm text-blue-600">Completed</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <div className="text-3xl font-bold text-emerald-700">{formatCurrency(stats.revenue)}</div>
          <div className="text-sm text-emerald-600">Total Revenue</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Status:</span>
        {STATUS_OPTIONS.map(status => (
          <button
            key={status}
            onClick={() => handleStatusFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === status
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {bookings.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Guest</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Listing</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map(booking => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      {/* Guest */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-medium">
                            {(booking.user?.name || "G").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.user?.name || "Guest"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.user?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Listing */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {booking.listing?.title || "Listing"}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.listing?.location || ""}
                        </p>
                      </td>
                      
                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </td>
                      
                      {/* Amount */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">
                          {formatCurrency(Number(booking.totalPrice))}
                        </p>
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                          STATUS_STYLES[booking.status] || "bg-gray-100"
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Confirm"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              current={pagination.page} 
              total={pagination.pages} 
              onChange={handlePageChange} 
            />
          </>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {statusFilter === "ALL"
                ? "You don't have any bookings yet"
                : `No ${statusFilter.toLowerCase()} bookings`}
            </p>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Booking Details</h2>
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {(selectedBooking.user?.name || "G").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedBooking.user?.name || "Guest"}</p>
                  <p className="text-sm text-gray-500">{selectedBooking.user?.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Listing</p>
                  <p className="font-medium">{selectedBooking.listing?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${STATUS_STYLES[selectedBooking.status]}`}>
                    {selectedBooking.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedBooking.bookingDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-medium">{selectedBooking.guests || 1}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedBooking.duration || 0} hours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(selectedBooking.totalPrice))}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booked On</p>
                  <p className="font-medium">
                    {new Date(selectedBooking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {selectedBooking.specialRequests && (
                <div>
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="text-gray-700 mt-1">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {selectedBooking.status === "PENDING" && (
                <button
                  onClick={() => { 
                    handleConfirm(selectedBooking.id); 
                    setSelectedBooking(null); 
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}