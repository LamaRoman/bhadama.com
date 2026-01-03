"use client";

import { useState, useEffect } from "react";
import { api } from "../../../../utils/api";
import { toast } from "react-hot-toast";
import {
  FileText, CheckCircle, XCircle, Eye, Clock,
  User, Loader2, Flag, TrendingUp
} from "lucide-react";

export default function BlogModerationTab({ dateRange }) {
  const [activeSubTab, setActiveSubTab] = useState("pending");
  const [blogs, setBlogs] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeSubTab === "pending") {
          const data = await api("/api/admin/blogs/pending");
          if (!data.error) setBlogs(data.blogs || []);
        } else if (activeSubTab === "all") {
          const data = await api("/api/admin/blogs");
          if (!data.error) setBlogs(data.blogs || []);
        } else if (activeSubTab === "flagged") {
          const data = await api("/api/admin/blogs/comments/flagged");
          if (!data.error) setFlaggedComments(data.comments || []);
        } else if (activeSubTab === "stats") {
          const data = await api("/api/admin/blogs/stats");
          if (!data.error) setStats(data);
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeSubTab]);

  const handleApprove = async (blogId) => {
    setActionLoading(blogId);
    try {
      const data = await api(`/api/admin/blogs/${blogId}/approve`, { method: "POST" });
      if (!data.error) {
        toast.success("Blog approved!");
        setBlogs(prev => prev.filter(b => b.id !== blogId));
      }
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || !selectedBlog) return;
    setActionLoading(selectedBlog.id);
    try {
      const data = await api(`/api/admin/blogs/${selectedBlog.id}/reject`, {
        method: "POST",
        body: { reason: rejectReason },
      });
      if (!data.error) {
        toast.success("Blog rejected");
        setBlogs(prev => prev.filter(b => b.id !== selectedBlog.id));
        setShowRejectModal(false);
        setRejectReason("");
      }
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Blog Moderation</h2>
        <p className="text-gray-600">Review and moderate blog posts</p>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "pending", label: "Pending", icon: Clock },
          { id: "all", label: "All Blogs", icon: FileText },
          { id: "flagged", label: "Flagged Comments", icon: Flag },
          { id: "stats", label: "Stats", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeSubTab === tab.id ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : activeSubTab === "pending" ? (
        blogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">All caught up!</h3>
            <p className="text-gray-600">No blogs pending review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-xl border p-6">
                <div className="flex gap-4">
                  {blog.coverImage && (
                    <img src={blog.coverImage} alt="" className="w-32 h-24 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{blog.title}</h3>
                    <p className="text-sm text-gray-500">
                      By {blog.author?.name} • {blog.wordCount} words • SEO: {blog.seoScore}/100
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleApprove(blog.id)}
                        disabled={actionLoading === blog.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => { setSelectedBlog(blog); setShowRejectModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeSubTab === "stats" && stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Blogs</p>
            <p className="text-3xl font-bold">{stats.blogs.total}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-3xl font-bold">{stats.blogs.published}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold">{stats.blogs.pending}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-3xl font-bold">{stats.engagement.views}</p>
          </div>
        </div>
      ) : null}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Blog</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-gray-600">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}