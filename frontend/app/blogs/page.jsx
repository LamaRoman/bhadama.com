"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { 
  Search, Filter, Clock, Heart, MessageCircle, 
  ChevronRight, TrendingUp, Tag, User, Calendar,
  Loader2, BookOpen, LogIn, PenLine
} from "lucide-react";

// Blog categories with labels and colors
const CATEGORIES = [
  { value: "all", label: "All Posts", color: "gray" },
  { value: "SPACE_TOUR", label: "Space Tours", color: "blue" },
  { value: "HOSTING_TIPS", label: "Hosting Tips", color: "green" },
  { value: "LOCAL_GUIDE", label: "Local Guides", color: "purple" },
  { value: "EVENT_EXPERIENCE", label: "Event Experiences", color: "pink" },
  { value: "PLANNING_TIPS", label: "Planning Tips", color: "orange" },
  { value: "VENUE_REVIEW", label: "Venue Reviews", color: "yellow" },
  { value: "INSPIRATION", label: "Inspiration", color: "indigo" },
  { value: "GENERAL", label: "General", color: "gray" },
];

const getCategoryStyle = (category) => {
  const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-700",
    indigo: "bg-indigo-100 text-indigo-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return styles[cat.color] || styles.gray;
};

const getCategoryLabel = (category) => {
  const cat = CATEGORIES.find(c => c.value === category);
  return cat?.label || category;
};

// Blog Card Component
const BlogCard = ({ blog, featured = false }) => {
  const router = useRouter();
  
  return (
    <article 
      onClick={() => router.push(`/blogs/${blog.slug}`)}
      className={`group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        featured ? "md:col-span-2 md:flex" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? "md:w-1/2" : "aspect-[16/10]"}`}>
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              featured ? "md:h-full h-48" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-300" />
          </div>
        )}
        
        {/* Category Badge */}
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryStyle(blog.category)}`}>
          {getCategoryLabel(blog.category)}
        </span>
        
        {/* Reading Time */}
        <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {blog.readingTime} min read
        </span>
      </div>
      
      {/* Content */}
      <div className={`p-6 ${featured ? "md:w-1/2 md:flex md:flex-col md:justify-center" : ""}`}>
        {/* Author & Date */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            {blog.author?.profilePhoto ? (
              <img 
                src={blog.author.profilePhoto} 
                alt={blog.author.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                {blog.author?.name?.charAt(0) || "?"}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">{blog.author?.name}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">
            {new Date(blog.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </span>
        </div>
        
        {/* Title */}
        <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 ${
          featured ? "text-2xl" : "text-lg"
        }`}>
          {blog.title}
        </h3>
        
        {/* Excerpt */}
        <p className={`text-gray-600 line-clamp-2 mb-4 ${featured ? "text-base" : "text-sm"}`}>
          {blog.excerpt}
        </p>
        
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {blog._count?.likes || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {blog._count?.comments || 0}
          </span>
          {blog.viewCount > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {blog.viewCount} views
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default function BlogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Fetch blogs
  const fetchBlogs = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setApiError(null);
      
      const params = new URLSearchParams();
      params.set("page", pageNum.toString());
      params.set("limit", "12");
      params.set("sort", sort);
      
      if (category && category !== "all") {
        params.set("category", category);
      }
      if (search) {
        params.set("search", search);
      }
      
      const data = await api(`/api/blogs?${params.toString()}`);
      
      if (data.error) {
        setApiError(data.error);
        console.error("API Error:", data.error);
        return;
      }
      
      if (append) {
        setBlogs(prev => [...prev, ...(data.blogs || [])]);
      } else {
        setBlogs(data.blogs || []);
      }
      
      setTotal(data.pagination?.total || 0);
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
      
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      setApiError("Failed to connect to server. Please check if the API is running.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch featured blogs
  const fetchFeatured = async () => {
    try {
      const data = await api("/api/blogs/featured?limit=3");
      if (!data.error) {
        setFeaturedBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Failed to fetch featured:", error);
    }
  };

  // Fetch popular tags
  const fetchTags = async () => {
    try {
      const data = await api("/api/blogs/tags?limit=15");
      if (!data.error) {
        setPopularTags(data.tags || []);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFeatured();
    fetchTags();
  }, []);

  // Fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchBlogs(1, false);
  }, [category, sort, search]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs(1, false);
  };

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog & Stories
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Tips, guides, and stories from our hosting community. Learn from experiences and get inspired for your next event.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Featured Blogs */}
        {featuredBlogs.length > 0 && !search && category === "all" && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Stories</h2>
              <span className="text-sm text-gray-500">Editor's picks</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredBlogs.map((blog, index) => (
                <BlogCard key={blog.id} blog={blog} featured={index === 0} />
              ))}
            </div>
          </section>
        )}

        {/* Filters & Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    category === cat.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort & Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {total} {total === 1 ? "article" : "articles"} found
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="mostLiked">Most Liked</option>
              </select>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : apiError ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
                <p className="text-gray-600 mb-2">{apiError}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Make sure the backend server is running and the blog routes are configured.
                </p>
                <button
                  onClick={() => fetchBlogs(1, false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-6">
                  {search ? `No results for "${search}"` : "No articles in this category yet"}
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View All Articles
                </button>
              </div>
            ) : (
              <>
                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        "Load More Articles"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 space-y-8">
            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Popular Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag.tag}
                      onClick={() => setSearch(tag.tag)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      #{tag.tag}
                      <span className="ml-1 text-gray-400 text-xs">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Write a Blog CTA */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-xl mb-2">Share Your Story</h3>
              <p className="text-blue-100 text-sm mb-4">
                Have an experience to share? Write a blog and inspire others!
              </p>
              {authLoading ? (
                <div className="inline-block px-4 py-2 bg-white/20 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : user ? (
                <Link
                  href={user.role === "HOST" ? "/host/blogs/new" : "/users/blogs/new"}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  <PenLine className="w-4 h-4" />
                  Start Writing
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/blogs"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login to Write
                </Link>
              )}
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat.value
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}