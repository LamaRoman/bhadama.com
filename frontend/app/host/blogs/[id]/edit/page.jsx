"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { api } from "../../../../utils/api";
import { toast, Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import SEOScoreIndicator from "../../../../../components/blog/SEOScoreIndicator";
import {
  ArrowLeft, Save, Send, Eye, X, Plus,
  Loader2, Image as ImageIcon, AlertTriangle, Info,
  ChevronDown, Link as LinkIcon
} from "lucide-react";

// Dynamic import for blog editor
const BlogEditor = dynamic(
  () => import("../../../../../components/blog/BlogEditor"),
  { 
    ssr: false,
    loading: () => (
      <div className="border border-gray-200 rounded-xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
        <p className="text-gray-500">Loading editor...</p>
      </div>
    )
  }
);

// Categories
const CATEGORIES = [
  { value: "SPACE_TOUR", label: "Space Tour", description: "Showcase your listing" },
  { value: "HOSTING_TIPS", label: "Hosting Tips", description: "Advice for hosts" },
  { value: "LOCAL_GUIDE", label: "Local Guide", description: "Area attractions, vendors" },
  { value: "ANNOUNCEMENT", label: "Announcement", description: "Updates, offers" },
  { value: "EVENT_EXPERIENCE", label: "Event Experience", description: "Share your event story" },
  { value: "PLANNING_TIPS", label: "Planning Tips", description: "How you planned your event" },
  { value: "VENUE_REVIEW", label: "Venue Review", description: "Detailed space reviews" },
  { value: "INSPIRATION", label: "Inspiration", description: "Decor ideas, themes" },
  { value: "GENERAL", label: "General", description: "Anything event-related" },
];

export default function HostBlogEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  
  const blogId = params?.id;
  const isEditMode = !!blogId;
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    focusKeyword: "",
    coverImage: "",
    coverImageAlt: "",
    category: "GENERAL",
    tags: [],
    listingId: null,
    allowComments: true,
  });
  
  const [wordCount, setWordCount] = useState(0);
  const [newTag, setNewTag] = useState("");
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [listings, setListings] = useState([]);
  const [originalStatus, setOriginalStatus] = useState("DRAFT");

  // Check auth
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
    if (!authLoading && user && user.role !== "HOST") {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Fetch existing blog for edit mode
  useEffect(() => {
    if (!isEditMode || !user) return;
    
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await api("/api/host/blogs");
        const blog = data.blogs?.find(b => b.id === parseInt(blogId));
        
        if (!blog) {
          toast.error("Blog not found");
          router.push("/host/dashboard");
          return;
        }
        
        setForm({
          title: blog.title || "",
          content: blog.content || "",
          excerpt: blog.excerpt || "",
          metaTitle: blog.metaTitle || "",
          metaDescription: blog.metaDescription || "",
          focusKeyword: blog.focusKeyword || "",
          coverImage: blog.coverImage || "",
          coverImageAlt: blog.coverImageAlt || "",
          category: blog.category || "GENERAL",
          tags: blog.tags || [],
          listingId: blog.listingId || null,
          allowComments: blog.allowComments ?? true,
        });
        setWordCount(blog.wordCount || 0);
        setOriginalStatus(blog.status);
        
        if (data.listings) {
          setListings(data.listings);
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        toast.error("Failed to load blog");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [isEditMode, blogId, user, router]);

  // Fetch listings for new blog
  useEffect(() => {
    if (!user || isEditMode) return;
    
    const fetchListings = async () => {
      try {
        const data = await api("/api/host/blogs");
        if (!data.error && data.listings) {
          setListings(data.listings);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      }
    };
    
    fetchListings();
  }, [user, isEditMode]);

  // Handle content change from editor
  const handleContentChange = useCallback((html, words) => {
    setForm(prev => ({ ...prev, content: html }));
    setWordCount(words);
  }, []);

  // Handle cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const data = await api("/api/host/blogs/upload-image", {
        method: "POST",
        body: formData,
      });
      
      if (data.error) {
        toast.error(data.error);
      } else {
        setForm(prev => ({ ...prev, coverImage: data.url }));
        toast.success("Cover image uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle inline image upload for editor
  const handleEditorImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    
    const data = await api("/api/host/blogs/upload-image", {
      method: "POST",
      body: formData,
    });
    
    if (data.error) throw new Error(data.error);
    return data.url;
  };

  // Add tag
  const addTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag("");
    }
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      toast.error("Please add a title");
      return;
    }
    
    setSaving(true);
    try {
      const endpoint = isEditMode ? `/api/host/blogs/${blogId}` : "/api/host/blogs";
      const method = isEditMode ? "PUT" : "POST";
      
      const data = await api(endpoint, {
        method,
        body: { ...form, wordCount },
      });
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(isEditMode ? "Changes saved" : "Draft saved");
        if (!isEditMode && data.blog?.id) {
          router.replace(`/host/blogs/${data.blog.id}/edit`);
        }
      }
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    const errors = [];
    
    if (!form.title || form.title.trim().length < 10) {
      errors.push("Title must be at least 10 characters");
    }
    if (wordCount < 500) {
      errors.push(`Content must be at least 500 words (currently ${wordCount})`);
    }
    if (!form.metaDescription || form.metaDescription.length < 50) {
      errors.push("Meta description is required (at least 50 characters)");
    }
    if (!form.coverImage) {
      errors.push("Cover image is required");
    }
    if (form.tags.length < 2) {
      errors.push("At least 2 tags are required");
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }
    
    setPublishing(true);
    try {
      // First save
      const saveEndpoint = isEditMode ? `/api/host/blogs/${blogId}` : "/api/host/blogs";
      const saveMethod = isEditMode ? "PUT" : "POST";
      
      const saveData = await api(saveEndpoint, {
        method: saveMethod,
        body: { ...form, wordCount },
      });
      
      if (saveData.error) {
        toast.error(saveData.error);
        return;
      }
      
      const savedBlogId = isEditMode ? blogId : saveData.blog?.id;
      
      // Then publish
      const publishData = await api(`/api/host/blogs/${savedBlogId}/publish`, { method: "POST" });
      
      if (publishData.error) {
        toast.error(publishData.error);
        if (publishData.validationErrors) {
          publishData.validationErrors.forEach(err => toast.error(err));
        }
      } else {
        toast.success(publishData.message || "Blog published!");
        router.push("/host/dashboard?tab=blogs");
      }
    } catch (error) {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "HOST") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isEditMode ? "Edit Blog" : "Write New Blog"}
                </h1>
                <p className="text-sm text-gray-500">
                  {originalStatus === "PUBLISHED" ? "Published" : "Draft"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving || publishing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              
              <button
                onClick={handlePublish}
                disabled={saving || publishing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Publish</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Editor Column */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your blog title..."
                className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 focus:outline-none bg-transparent"
                maxLength={200}
              />
              <p className="text-sm text-gray-400 mt-1">{form.title.length}/200</p>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image *</label>
              {form.coverImage ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={form.coverImage} alt={form.coverImageAlt || "Cover"} className="w-full h-64 object-cover" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, coverImage: "" }))}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                  {uploadingCover ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload cover image</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
              )}
              
              {form.coverImage && (
                <input
                  type="text"
                  value={form.coverImageAlt}
                  onChange={(e) => setForm(prev => ({ ...prev, coverImageAlt: e.target.value }))}
                  placeholder="Describe this image (alt text for SEO)"
                  className="w-full mt-2 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={150}
                />
              )}
            </div>

            {/* Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content * (minimum 500 words)</label>
              <BlogEditor
                content={form.content}
                onChange={handleContentChange}
                onImageUpload={handleEditorImageUpload}
                placeholder="Start writing your blog post..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt (optional)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="A short summary..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={300}
              />
              <p className="text-sm text-gray-400 mt-1">{form.excerpt.length}/300</p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-6">
            <SEOScoreIndicator blog={{ ...form, wordCount }} />

            {/* Category */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {CATEGORIES.find(c => c.value === form.category)?.description}
              </p>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags * (at least 2)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || form.tags.length >= 10}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-gray-200 rounded-full">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{form.tags.length}/10 tags</p>
            </div>

            {/* Link to Listing */}
            {listings.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4 inline mr-1" />
                  Link to Listing
                </label>
                <select
                  value={form.listingId || ""}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    listingId: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No listing</option>
                  {listings.map((listing) => (
                    <option key={listing.id} value={listing.id}>{listing.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* SEO Settings */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSeoSettings(!showSeoSettings)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="font-medium text-gray-700">SEO Settings</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSeoSettings ? "rotate-180" : ""}`} />
              </button>
              
              {showSeoSettings && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                    <input
                      type="text"
                      value={form.focusKeyword}
                      onChange={(e) => setForm(prev => ({ ...prev, focusKeyword: e.target.value }))}
                      placeholder="e.g., outdoor wedding venue"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                      placeholder={form.title || "Enter SEO title..."}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={70}
                    />
                    <p className="text-xs text-gray-400 mt-1">{(form.metaTitle || form.title).length}/70</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description *</label>
                    <textarea
                      value={form.metaDescription}
                      onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                      placeholder="A compelling description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      maxLength={170}
                    />
                    <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/170</p>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowComments}
                  onChange={(e) => setForm(prev => ({ ...prev, allowComments: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Allow comments</span>
              </label>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}