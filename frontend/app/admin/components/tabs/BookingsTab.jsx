"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api.js";
import { StatusBadge, LoadingSpinner, EmptyState, ActionButton, formatCurrency, formatDate } from "../shared";
import { Calendar, Search, Eye, XCircle, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function BookingsTab() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/bookings/recent?limit=100');
      setBookings(Array.isArray(res) ? res : []);
    } catch { toast.error("Failed to load bookings"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancelBooking = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api(`/api/admin/bookings/${id}/cancel`, { method: 'PUT' });
      toast.success("Booking cancelled");
      fetchData();
    } catch { toast.error("Failed to cancel"); }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (statusFilter === "all" || b.status === statusFilter);
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
    pending: bookings.filter(b => b.status === "PENDING").length,
    completed: bookings.filter(b => b.status === "COMPLETED").length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
  };

  if (loading) return <LoadingSpinner message="Loading bookings..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Bookings Management</h2>
          <p className="text-gray-600">View and manage all bookings</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-600">Total</p></div>
        <div className="bg-green-50 rounded-lg p-4 shadow"><p className="text-2xl font-bold text-green-600">{stats.confirmed}</p><p className="text-sm text-gray-600">Confirmed</p></div>
        <div className="bg-yellow-50 rounded-lg p-4 shadow"><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-sm text-gray-600">Pending</p></div>
        <div className="bg-blue-50 rounded-lg p-4 shadow"><p className="text-2xl font-bold text-blue-600">{stats.completed}</p><p className="text-sm text-gray-600">Completed</p></div>
        <div className="bg-red-50 rounded-lg p-4 shadow"><p className="text-2xl font-bold text-red-600">{stats.cancelled}</p><p className="text-sm text-gray-600">Cancelled</p></div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedBookings.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12">
                <EmptyState icon={Calendar} title="No bookings found" description="No bookings match your criteria" />
              </td></tr>
            ) : paginatedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium">#{String(booking.id).substring(0, 8)}</p>
                  <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                </td>
                <td className="px-6 py-4 text-sm">{booking.user?.name || "Unknown"}</td>
                <td className="px-6 py-4 text-sm truncate max-w-[200px]">{booking.listing?.title || "Unknown"}</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(booking.totalPrice)}</td>
                <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <ActionButton icon={Eye} label="View" onClick={() => toast.info("View coming soon")} />
                    {booking.status === "CONFIRMED" && (
                      <ActionButton icon={XCircle} label="Cancel" variant="danger" onClick={() => handleCancelBooking(booking.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between">
            <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}