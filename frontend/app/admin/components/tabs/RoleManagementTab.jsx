"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../utils/api.js";
import toast from "react-hot-toast";

export default function RoleManagementTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

const fetchUsers = async () => {
  try {
    setLoading(true);
    
    // Fetch all recent users
    const response = await api(`/api/admin/users/recent?limit=100`);
    let allUsers = Array.isArray(response) ? response : [];
    
    // Apply client-side filtering
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(u => 
        u.name?.toLowerCase().includes(searchLower) || 
        u.email?.toLowerCase().includes(searchLower)
      );
    }
    
    if (roleFilter) {
      allUsers = allUsers.filter(u => u.role === roleFilter);
    }
    
    // Apply client-side pagination
    const total = allUsers.length;
    const limit = 15;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedUsers = allUsers.slice(start, end);
    
    setUsers(paginatedUsers);
    setPagination({ total, pages, page, limit });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    toast.error("Failed to load users");
  } finally {
    setLoading(false);
  }
};

const handleRoleChange = async (userId, currentRole) => {
  const newRole = currentRole === "USER" ? "HOST" : "USER";
  
  if (!confirm(`Change this user's role from ${currentRole} to ${newRole}?`)) {
    return;
  }

  setChangingRole(userId);
  try {
    // You'll need to add this endpoint to your backend
    await api(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: { role: newRole }
    });

    toast.success(`Role changed to ${newRole}`);
    
    // Refresh the list
    fetchUsers();
  } catch (error) {
    toast.error(error.message || "Failed to change role");
  } finally {
    setChangingRole(null);
  }
};
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600 text-sm">Change users between USER and HOST roles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="USER">Users Only</option>
          <option value="HOST">Hosts Only</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-4xl">👥</span>
            <p className="text-gray-500 mt-2">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Stats</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Joined</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          user.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {user.name}
                          {user.googleId && (
                            <span title="Google Account" className="text-xs">
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === "HOST" 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "HOST" ? "🏠" : "👤"} {user.role}
                    </span>
                  </td>

                  {/* Stats */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      <span title="Listings">{user._count?.listings || 0} listings</span>
                      <span className="mx-2">•</span>
                      <span title="Bookings">{user._count?.bookings || 0} bookings</span>
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRoleChange(user.id, user.role)}
                      disabled={changingRole === user.id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        user.role === "USER"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      } disabled:opacity-50`}
                    >
                      {changingRole === user.id ? (
                        "Changing..."
                      ) : user.role === "USER" ? (
                        "Make Host"
                      ) : (
                        "Make User"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {users.length} of {pagination.total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}