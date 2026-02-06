"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../utils/api.js";
import { useAuth } from "../../../contexts/AuthContext.js";
import {
  ArrowLeft, Calendar, Clock, Heart, MessageCircle, Share2,
  Bookmark, Eye, User, ChevronRight, Loader2, Send,
  Flag, MoreHorizontal, Edit2, Trash2, AlertCircle
} from "lucide-react";

// Category styles
const getCategoryStyle = (category) => {
  const styles = {
    SPACE_TOUR: "bg-blue-100 text-blue-700",
    HOSTING_TIPS: "bg-green-100 text-green-700",
    LOCAL_GUIDE: "bg-purple-100 text-purple-700",
    EVENT_EXPERIENCE: "bg-pink-100 text-pink-700",
    PLANNING_TIPS: "bg-orange-100 text-orange-700",
    VENUE_REVIEW: "bg-yellow-100 text-yellow-700",
    INSPIRATION: "bg-indigo-100 text-indigo-700",
    GENERAL: "bg-gray-100 text-gray-700",
  };
  return styles[category] || styles.GENERAL;
};

const getCategoryLabel = (category) => {
  const labels = {
    SPACE_TOUR: "Space Tour",
    HOSTING_TIPS: "Hosting Tips",
    LOCAL_GUIDE: "Local Guide",
    EVENT_EXPERIENCE: "Event Experience",
    PLANNING_TIPS: "Planning Tips",
    VENUE_REVIEW: "Venue Review",
    INSPIRATION: "Inspiration",
    GENERAL: "General",
  };
  return labels[category] || category;
};

// Comment Component
const CommentItem = ({ comment, blogAuthorId, onReply, onDelete, onLike, onFlag, currentUserId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isAuthor = comment.user?.id === blogAuthorId;
  const isOwnComment = comment.user?.id === currentUserId;
  const canEdit = isOwnComment && (Date.now() - new Date(comment.createdAt).getTime()) < 15 * 60 * 1000;
  
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    await onReply(comment.id, replyContent);
    setReplyContent("");
    setShowReplyForm(false);
    setSubmitting(false);
  };
  
  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        {comment.user?.profilePhoto ? (
          <img 
            src={comment.user.profilePhoto} 
            alt={comment.user.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {comment.user?.name?.charAt(0) || "?"}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{comment.user?.name}</span>
            {isAuthor && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Author
              </span>
            )}
            {comment.user?.role === "HOST" && !isAuthor && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Host
              </span>
            )}
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          
          {/* Content */}
          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</p>
          
          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart className="w-4 h-4" />
              {comment._count?.likes || 0}
            </button>
            
            {currentUserId && !comment.parentId && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-500 hover:text-blue-500 transition-colors"
              >
                Reply
              </button>
            )}
            
            {currentUserId && !isOwnComment && (
              <button
                onClick={() => onFlag(comment.id)}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
            
            {isOwnComment && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        onDelete(comment.id);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Posting..." : "Reply"}
                </button>
              </div>
            </form>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  blogAuthorId={blogAuthorId}
                  onReply={onReply}
                  onDelete={onDelete}
                  onLike={onLike}
                  onFlag={onFlag}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  // Comment form
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch blog
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await api(`/api/blogs/${slug}`);
        
        if (data.error) {
          console.error(data.error);
          router.push("/blogs");
          return;
        }
        
        setBlog(data.blog);
        setRelatedBlogs(data.relatedBlogs || []);
        setLikeCount(data.blog._count?.likes || 0);
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        router.push("/blogs");
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchBlog();
    }
  }, [slug, router]);

  // Check like status
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !blog) return;
      
      try {
        const data = await api(`/api/blogs/${blog.id}/like-status`);
        if (!data.error) {
          setLiked(data.liked);
        }
      } catch (error) {
        console.error("Failed to check like status:", error);
      }
    };
    
    checkLikeStatus();
  }, [user, blog]);

  // Fetch comments
  const fetchComments = async (page = 1) => {
    if (!blog) return;
    
    try {
      setLoadingComments(true);
      const data = await api(`/api/blogs/${blog.id}/comments?page=${page}&limit=20`);
      
      if (!data.error) {
        if (page === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setHasMoreComments(page < data.pagination?.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (blog) {
      fetchComments(1);
    }
  }, [blog]);

  // Handle like
  const handleLike = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    try {
      const data = await api(`/api/blogs/${blog.id}/like`, { method: "POST" });
      
      if (!data.error) {
        setLiked(data.liked);
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // Handle new comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    setSubmittingComment(true);
    try {
      const data = await api(`/api/blogs/${blog.id}/comments`, {
        method: "POST",
        body: { content: newComment }
      });
      
      if (!data.error) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle reply
  const handleReply = async (parentId, content) => {
    if (!user) return;
    
    try {
      const data = await api(`/api/blogs/${blog.id}/comments`, {
        method: "POST",
        body: { content, parentId }
      });
      
      if (!data.error) {
        // Add reply to parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.comment]
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    
    try {
      const data = await api(`/api/blogs/comments/${commentId}`, {
        method: "DELETE"
      });
      
      if (!data.error) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  // Handle like comment
  const handleLikeComment = async (commentId) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    try {
      await api(`/api/blogs/comments/${commentId}/like`, { method: "POST" });
      // Optimistically update UI
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            _count: {
              ...comment._count,
              likes: (comment._count?.likes || 0) + 1
            }
          };
        }
        // Check replies
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  _count: {
                    ...reply._count,
                    likes: (reply._count?.likes || 0) + 1
                  }
                };
              }
              return reply;
            })
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  // Handle flag comment
  const handleFlagComment = async (commentId) => {
    if (!confirm("Report this comment as inappropriate?")) return;
    
    try {
      const data = await api(`/api/blogs/comments/${commentId}/flag`, {
        method: "POST",
        body: { reason: "Inappropriate content" }
      });
      
      if (!data.error) {
        alert("Comment reported. Thank you!");
      }
    } catch (error) {
      console.error("Failed to flag comment:", error);
    }
  };

  // Share blog
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Blog not found</h2>
          <Link href="/blogs" className="text-blue-600 hover:underline">
            Back to blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Image */}
      {blog.coverImage && (
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.coverImageAlt || blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Category & Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryStyle(blog.category)}`}>
            {getCategoryLabel(blog.category)}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {new Date(blog.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {blog.readingTime} min read
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="w-4 h-4" />
            {blog.viewCount} views
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {blog.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
          <Link href={`/users/${blog.author?.id}`} className="flex items-center gap-3">
            {blog.author?.profilePhoto ? (
              <img 
                src={blog.author.profilePhoto} 
                alt={blog.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                {blog.author?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{blog.author?.name}</p>
              <p className="text-sm text-gray-500">
                {blog.author?.role === "HOST" ? "Space Host" : "Community Writer"}
                {blog.author?._count?.blogPosts > 1 && ` • ${blog.author._count.blogPosts} articles`}
              </p>
            </div>
          </Link>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                liked 
                  ? "bg-red-50 border-red-200 text-red-600" 
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={handleShare}
              className="p-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Linked Listing */}
        {blog.listing && (
          <Link 
            href={`/public/listings/${blog.listing.slug}`}
            className="flex items-center gap-4 p-4 mb-8 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
          >
            {blog.listing.images?.[0] && (
              <img 
                src={blog.listing.images[0].url} 
                alt={blog.listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-blue-600 font-medium">Related Space</p>
              <p className="font-semibold text-gray-900">{blog.listing.title}</p>
              <p className="text-sm text-gray-500">{blog.listing.location}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-600" />
          </Link>
        )}

        {/* Content */}
        <article 
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12 pb-8 border-b border-gray-200">
            {blog.tags.map((tag, index) => (
              <Link
                key={index}
                href={`/blogs?search=${tag}`}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <section id="comments" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Comments ({blog._count?.comments || 0})
          </h2>

          {/* Comment Form */}
          {blog.allowComments ? (
            user ? (
              <form onSubmit={handleSubmitComment} className="mb-8">
                <div className="flex gap-3">
                  {user.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {user.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {submittingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {submittingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
                <p className="text-gray-600 mb-4">Sign in to join the conversation</p>
                <Link
                  href={`/auth/login?redirect=/blogs/${slug}`}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
              <p className="text-gray-500">Comments are disabled for this post</p>
            </div>
          )}

          {/* Comments List */}
          {loadingComments && comments.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  blogAuthorId={blog.authorId}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onFlag={handleFlagComment}
                  currentUserId={user?.id}
                />
              ))}
              
              {hasMoreComments && (
                <button
                  onClick={() => {
                    const nextPage = commentsPage + 1;
                    setCommentsPage(nextPage);
                    fetchComments(nextPage);
                  }}
                  disabled={loadingComments}
                  className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {loadingComments ? "Loading..." : "Load more comments"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  href={`/blogs/${relatedBlog.slug}`}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                >
                  {relatedBlog.coverImage ? (
                    <img
                      src={relatedBlog.coverImage}
                      alt={relatedBlog.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-indigo-100" />
                  )}
                  <div className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${getCategoryStyle(relatedBlog.category)}`}>
                      {getCategoryLabel(relatedBlog.category)}
                    </span>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedBlog.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {relatedBlog.readingTime} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}