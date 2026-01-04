"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../utils/api.js";
import { LoadingSpinner, EmptyState, formatDate } from "../shared";
import { FileText, Search } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AuditLogsTab() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api('/api/admin/audit-logs?limit=200');
      setLogs(Array.isArray(res) ? res : []);
    } catch (error) { toast.error("Failed to load audit logs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.admin?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (actionFilter === "all" || log.action === actionFilter);
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActionColor = (action) => {
    if (action?.includes("APPROVED") || action?.includes("RESTORED")) return "bg-green-100 text-green-800";
    if (action?.includes("REJECTED") || action?.includes("SUSPENDED")) return "bg-red-100 text-red-800";
    if (action?.includes("EXPORT")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) return <LoadingSpinner message="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Track all admin actions</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64" />
          </div>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Actions</option>
            {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedLogs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12">
                <EmptyState icon={FileText} title="No logs found" description="No audit logs match your criteria" />
              </td></tr>
            ) : paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600">{log.admin?.name?.charAt(0) || "S"}</span>
                    </div>
                    <span className="text-sm">{log.admin?.name || "System"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="px-6 py-4 text-sm">{log.entity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">ID: {log.entityId?.substring(0, 8)}...</td>
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