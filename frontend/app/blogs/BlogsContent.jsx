"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext.js";
import { api } from "../../utils/api.js";
import { 
  Search, Clock, Heart, MessageCircle, ChevronRight, 
  TrendingUp, Tag, Loader2, BookOpen, LogIn, PenLine
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

// BlogCard Component
const BlogCard = ({ blog, featured = false, onBlogClick }) => {
  return (
    <article 
      onClick={() => onBlogClick(blog.slug)}
      className={`group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        featured ? "md:col-span-2 md:flex" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? "md:w-1/2" : "aspect-[16/10]"}`}>
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              featured ? "md:h-full h-48" : ""
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-300" />
          </div>
        )}
        
        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${getCategoryStyle(blog.category)}`}>
          {getCategoryLabel(blog.category)}
        </span>
        
        <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {blog.readingTime || 5} min read
        </span>
      </div>
      
      <div className={`p-6 ${featured ? "md:w-1/2 md:flex md:flex-col md:justify-center" : ""}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            {blog.author?.profilePhoto ? (
              <img 
                src={blog.author.profilePhoto} 
                alt={blog.author.name}
                className="w-8 h-8 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                {blog.author?.name?.charAt(0) || "?"}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">{blog.author?.name || "Unknown"}</span>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">
            {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            }) : "N/A"}
          </span>
        </div>
        
        <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 ${
          featured ? "text-2xl" : "text-lg"
        }`}>
          {blog.title}
        </h3>
        
        <p className={`text-gray-600 line-clamp-2 mb-4 ${featured ? "text-base" : "text-sm"}`}>
          {blog.excerpt || "No description available."}
        </p>
        
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
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
              {blog.viewCount.toLocaleString()} views
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default function BlogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchBlogs = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setApiError(null);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "12",
        sort
      });
      
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      
      const data = await api(`/api/blogs?${params.toString()}`);
      
      if (data.error) {
        setApiError(data.error);
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

  const fetchFeatured = async () => {
    try {
      const data = await api("/api/blogs/featured?limit=3");
      if (!data.error) setFeaturedBlogs(data.blogs || []);
    } catch (error) {
      console.error("Failed to fetch featured:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await api("/api/blogs/tags?limit=15");
      if (!data.error) setPopularTags(data.tags || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  // Effects
  useEffect(() => {
    fetchFeatured();
    fetchTags();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchBlogs(1, false);
  }, [search, category, sort]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "all") params.set("category", category);
    if (sort !== "newest") params.set("sort", sort);
    router.replace(`/blogs?${params.toString()}`, { scroll: false });
  }, [search, category, sort, router]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBlogs(1, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogs(nextPage, true);
  };

  const handleBlogClick = (slug) => {
    router.push(`/blogs/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog & Stories</h1>
            <p className="text-xl text-blue-100 mb-8">
              Tips, guides, and stories from our hosting community. Learn from experiences and get inspired.
            </p>
            <form onSubmit={handleSearch} className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-12 pr-12 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 bg-white/80"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {featuredBlogs.length > 0 && !search && category === "all" && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Stories</h2>
              <span className="text-sm text-gray-500">Editor's picks</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredBlogs.map((blog, index) => (
                <BlogCard key={blog.id} blog={blog} featured={index === 0} onBlogClick={handleBlogClick} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    category === cat.value
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-md"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                {total.toLocaleString()} {total === 1 ? "article" : "articles"} found
              </p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
                <option value="mostLiked">Most Liked</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-2" />
                <span className="text-lg text-gray-600">Loading articles...</span>
              </div>
            ) : apiError ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 p-4">
                  <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Connection Error</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">{apiError}</p>
                <button
                  onClick={() => fetchBlogs(1, false)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No articles found</h3>
                <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                  {search ? `No results for "${search}"` : "No articles in this category yet"}
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                  }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg"
                >
                  View All Articles
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} onBlogClick={handleBlogClick} />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-12">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-10 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-2xl font-semibold text-lg hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                          Loading more articles...
                        </>
                      ) : (
                        "Load More Articles"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="lg:w-80 xl:w-96 space-y-6 sticky top-24 self-start">
            {popularTags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
                  <Tag className="w-6 h-6" />
                  Popular Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tagObj) => (
                    <button
                      key={tagObj.tag}
                      onClick={() => setSearch(tagObj.tag)}
                      className="px-4 py-2 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-sm font-medium rounded-full transition-all duration-200 shadow-sm border hover:border-blue-200"
                    >
                      #{tagObj.tag}
                      <span className="ml-1 text-xs bg-white/60 px-1.5 py-0.5 rounded-full">
                        ({tagObj.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="font-bold text-2xl mb-3">Share Your Story</h3>
              <p className="text-blue-100 mb-6 leading-relaxed">
                Have an experience to share? Write a blog and inspire thousands!
              </p>
              {authLoading ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : user ? (
                <Link
                  href={user.role === "HOST" ? "/host/blogs/new" : "/users/blogs/new"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
                >
                  <PenLine className="w-5 h-5" />
                  Start Writing
                </Link>
              ) : (
                <Link
                  href="/auth/login?redirect=/blogs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 backdrop-blur-sm"
                >
                  <LogIn className="w-5 h-5" />
                  Login to Write
                </Link>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-xl text-gray-900 mb-6">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.filter(c => c.value !== "all").map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md ${
                      category === cat.value
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "hover:bg-blue-50 text-gray-700 border border-transparent hover:border-blue-200"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronRight className={`w-5 h-5 ${category === cat.value ? 'text-white' : 'text-gray-400'}`} />
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