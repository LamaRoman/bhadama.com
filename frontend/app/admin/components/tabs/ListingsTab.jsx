"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import { StatusBadge, LoadingSpinner, EmptyState, ActionButton, formatCurrency, formatDate } from "../shared";
import { Home, Search, Check, X, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ListingsTab() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: itemsPerPage.toString(), page: currentPage.toString() });
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await api(`/api/admin/listings?${params}`);
      setListings(res?.listings || []);
      setTotalPages(res?.pagination?.totalPages || 1);
    } catch (error) {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApproveListing = async (id) => {
    try {
      await api(`/api/admin/listings/${id}/status`, { method: 'PUT', body: { status: 'ACTIVE' } });
      toast.success("Listing approved");
      fetchData();
    } catch { toast.error("Failed to approve"); }
  };

  const handleRejectListing = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await api(`/api/admin/listings/${id}/status`, { method: 'PUT', body: { status: 'REJECTED', reason } });
      toast.success("Listing rejected");
      fetchData();
    } catch { toast.error("Failed to reject"); }
  };

  const filteredListings = listings.filter(l =>
    l.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.host?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner message="Loading listings..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Listings Management</h2>
          <p className="text-gray-600">Review and manage all listings</p>
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
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Host</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredListings.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12">
                <EmptyState icon={Home} title="No listings found" description="No listings match your criteria" />
              </td></tr>
            ) : filteredListings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                      {listing.images?.[0]?.url ? (
                        <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : <Home className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{listing.title}</p>
                      <p className="text-xs text-gray-500">{listing.location || "No location"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{listing.host?.name || "Unknown"}</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(listing.hourlyRate)}/hr</td>
                <td className="px-6 py-4"><StatusBadge status={listing.status} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(listing.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <ActionButton icon={Eye} label="View" onClick={() => window.open(`/listings/${listing.id}`, '_blank')} />
                    {listing.status === "PENDING" && (
                      <>
                        <ActionButton icon={Check} label="Approve" variant="success" onClick={() => handleApproveListing(listing.id)} />
                        <ActionButton icon={X} label="Reject" variant="danger" onClick={() => handleRejectListing(listing.id)} />
                      </>
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