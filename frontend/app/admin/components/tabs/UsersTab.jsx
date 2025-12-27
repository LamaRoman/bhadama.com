"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api.js";
import { StatusBadge, LoadingSpinner, EmptyState, ActionButton, formatDate } from "../shared";
import { Users, Search, Ban, RotateCcw, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

export default function UsersTab() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, suspendedRes] = await Promise.all([
        api('/api/admin/users/recent?limit=50').catch(() => []),
        api('/api/admin/users/suspended').catch(() => [])
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setSuspendedUsers(Array.isArray(suspendedRes) ? suspendedRes : []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSuspendUser = async (userId) => {
    if (!confirm("Suspend this user?")) return;
    try {
      await api(`/api/admin/users/${userId}/suspend`, { method: 'PUT' });
      toast.success("User suspended");
      fetchData();
    } catch { toast.error("Failed to suspend user"); }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await api(`/api/admin/users/${userId}/restore`, { method: 'PUT' });
      toast.success("User restored");
      fetchData();
    } catch { toast.error("Failed to restore user"); }
  };

  const allUsers = [...users];
  suspendedUsers.forEach(su => { if (!allUsers.find(u => u.id === su.id)) allUsers.push(su); });

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" ||
      (filter === "suspended" && user.suspended) ||
      (filter === "active" && !user.suspended);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage all users on the platform</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search users..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {suspendedUsers.length > 0 && filter !== "active" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-800">{suspendedUsers.length} Suspended User{suspendedUsers.length > 1 ? 's' : ''}</h3>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedUsers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12">
                <EmptyState icon={Users} title="No users found" description="No users match your criteria" />
              </td></tr>
            ) : paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold">{user.name?.charAt(0) || "U"}</span>
                    </div>
                    <p className="font-medium text-gray-900">{user.name || "Unknown"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'HOST' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>{user.role}</span>
                </td>
                <td className="px-6 py-4"><StatusBadge status={user.suspended ? "SUSPENDED" : "ACTIVE"} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <ActionButton icon={Eye} label="View" variant="default" onClick={() => toast("View coming soon")} />
                    {user.suspended ? (
                      <ActionButton icon={RotateCcw} label="Restore" variant="success" onClick={() => handleRestoreUser(user.id)} />
                    ) : (
                      <ActionButton icon={Ban} label="Suspend" variant="danger" onClick={() => handleSuspendUser(user.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
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