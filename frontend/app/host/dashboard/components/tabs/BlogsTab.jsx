"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/app/utils/api";
import { toast } from "react-hot-toast";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Send, Clock,
  FileText, TrendingUp, Heart, MessageCircle,
  Loader2, CheckCircle, Search
} from "lucide-react";

// Status badge styles
const getStatusBadge = (status) => {
  const styles = {
    DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending Review" },
    PUBLISHED: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
    REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
    ARCHIVED: { bg: "bg-gray-100", text: "text-gray-500", label: "Archived" },
  };
  return styles[status] || styles.DRAFT;
};

// Category labels
const getCategoryLabel = (category) => {
  const labels = {
    SPACE_TOUR: "Space Tour",
    HOSTING_TIPS: "Hosting Tips",
    LOCAL_GUIDE: "Local Guide",
    ANNOUNCEMENT: "Announcement",
    EVENT_EXPERIENCE: "Event Experience",
    PLANNING_TIPS: "Planning Tips",
    VENUE_REVIEW: "Venue Review",
    INSPIRATION: "Inspiration",
    GENERAL: "General",
  };
  return labels[category] || category;
};

export default function BlogsTab({ refreshKey, onRefresh }) {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== "all") params.set("status", filter);
        
        const data = await api(`/api/host/blogs?${params.toString()}`);
        
        if (data.error) {
          toast.error(data.error);
        } else {
          setBlogs(data.blogs || []);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        // Don't show error toast - just set empty array
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [refreshKey, filter]);

  // Filter blogs by search
  const filteredBlogs = blogs.filter(blog => 
    blog.title?.toLowerCase().includes(search.toLowerCase()) ||
    blog.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Delete blog
  const handleDelete = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;
    
    setActionLoading(blogId);
    try {
      const data = await api(`/api/host/blogs/${blogId}`, { method: "DELETE" });
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Blog deleted");
        setBlogs(prev => prev.filter(b => b.id !== blogId));
      }
    } catch (error) {
      toast.error("Failed to delete blog");
    } finally {
      setActionLoading(null);
    }
  };

  // Unpublish blog
  const handleUnpublish = async (blogId) => {
    setActionLoading(blogId);
    try {
      const data = await api(`/api/host/blogs/${blogId}/unpublish`, { method: "POST" });
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Blog unpublished");
        setBlogs(prev => prev.map(b => 
          b.id === blogId ? { ...b, status: "DRAFT" } : b
        ));
      }
    } catch (error) {
      toast.error("Failed to unpublish blog");
    } finally {
      setActionLoading(null);
    }
  };

  // Publish blog
  const handlePublish = async (blogId) => {
    setActionLoading(blogId);
    try {
      const data = await api(`/api/host/blogs/${blogId}/publish`, { method: "POST" });
      
      if (data.error) {
        toast.error(data.error);
        if (data.validationErrors) {
          data.validationErrors.forEach(err => toast.error(err));
        }
      } else {
        toast.success("Blog published!");
        setBlogs(prev => prev.map(b => 
          b.id === blogId ? { ...b, status: "PUBLISHED" } : b
        ));
      }
    } catch (error) {
      toast.error("Failed to publish blog");
    } finally {
      setActionLoading(null);
    }
  };

  // Stats summary
  const stats = {
    total: blogs.length,
    published: blogs.filter(b => b.status === "PUBLISHED").length,
    draft: blogs.filter(b => b.status === "DRAFT").length,
    totalViews: blogs.reduce((sum, b) => sum + (b.viewCount || 0), 0),
    totalLikes: blogs.reduce((sum, b) => sum + (b._count?.likes || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Blogs</h2>
          <p className="text-gray-600">Share stories and promote your spaces</p>
        </div>
        <Link
          href="/host/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Write New Blog
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-sm text-gray-500">Views</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
              <p className="text-sm text-gray-500">Likes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "PUBLISHED", "DRAFT", "PENDING"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : getStatusBadge(status).label}
            </button>
          ))}
        </div>
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No blogs yet</h3>
          <p className="text-gray-600 mb-6">
            {filter !== "all" 
              ? `No ${getStatusBadge(filter).label.toLowerCase()} blogs found`
              : "Start writing to share your story and promote your spaces"}
          </p>
          <Link
            href="/host/blogs/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Write Your First Blog
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredBlogs.map((blog) => {
              const status = getStatusBadge(blog.status);
              const isLoading = actionLoading === blog.id;
              
              return (
                <div key={blog.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Cover Image */}
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {blog.title || "Untitled"}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                            <span className={`px-2 py-0.5 rounded ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                            <span>{getCategoryLabel(blog.category)}</span>
                            <span>{blog.wordCount || 0} words</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {blog.status === "PUBLISHED" && (
                            <Link
                              href={`/blogs/${blog.slug}`}
                              target="_blank"
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          
                          <Link
                            href={`/host/blogs/${blog.id}/edit`}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          
                          {blog.status === "DRAFT" && (
                            <button
                              onClick={() => handlePublish(blog.id)}
                              disabled={isLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Publish"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          {blog.status === "PUBLISHED" && (
                            <button
                              onClick={() => handleUnpublish(blog.id)}
                              disabled={isLoading}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-50"
                              title="Unpublish"
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(blog.id)}
                            disabled={isLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Stats (for published) */}
                      {blog.status === "PUBLISHED" && (
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {blog.viewCount || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {blog._count?.likes || 0} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {blog._count?.comments || 0} comments
                          </span>
                          {blog.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(blog.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Rejection reason */}
                      {blog.status === "REJECTED" && blog.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Reason:</strong> {blog.rejectionReason}
                          </p>
                        </div>
                      )}
                      
                      {/* Linked listing */}
                      {blog.listing && (
                        <div className="mt-2 text-sm text-gray-500">
                          Linked to: <span className="font-medium text-gray-700">{blog.listing.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}