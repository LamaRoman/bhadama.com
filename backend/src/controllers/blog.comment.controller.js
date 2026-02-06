// controllers/blogCommentController.js
// Blog comments with nested replies (2 levels)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get comments for a blog post
 * GET /api/blogs/:blogId/comments
 */
export const getBlogComments = async (req, res) => {
  try {
    const blogId = parseInt(req.params.blogId);
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Get blog to check if it exists
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, status: 'PUBLISHED' },
      select: { id: true, authorId: true, allowComments: true }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (!blog.allowComments) {
      return res.json({ comments: [], message: 'Comments are disabled for this blog' });
    }
    
    // Get top-level comments with replies
    const [comments, total] = await Promise.all([
      prisma.blogComment.findMany({
        where: {
          blogPostId: blogId,
          parentId: null, // Only top-level comments
          status: 'VISIBLE'
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePhoto: true,
              role: true
            }
          },
          replies: {
            where: { status: 'VISIBLE' },
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profilePhoto: true,
                  role: true
                }
              },
              _count: {
                select: { likes: true }
              }
            }
          },
          _count: {
            select: { likes: true }
          }
        }
      }),
      prisma.blogComment.count({
        where: {
          blogPostId: blogId,
          parentId: null,
          status: 'VISIBLE'
        }
      })
    ]);
    
    // Mark author replies
    const commentsWithAuthorFlag = comments.map(comment => ({
      ...comment,
      isAuthorReply: comment.user.id === blog.authorId,
      replies: comment.replies.map(reply => ({
        ...reply,
        isAuthorReply: reply.user.id === blog.authorId
      }))
    }));
    
    res.json({
      comments: commentsWithAuthorFlag,
      blogAuthorId: blog.authorId,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};


// ==================== AUTHENTICATED USER ENDPOINTS ====================

/**
 * Add comment to blog
 * POST /api/blogs/:blogId/comments
 */
export const addComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const blogId = parseInt(req.params.blogId);
    const { content, parentId } = req.body;
    
    // Validate content
    if (!content || content.trim().length < 2) {
      return res.status(400).json({ error: 'Comment must be at least 2 characters' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
    }
    
    // Get blog
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, status: 'PUBLISHED' },
      select: { id: true, authorId: true, allowComments: true }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (!blog.allowComments) {
      return res.status(400).json({ error: 'Comments are disabled for this blog' });
    }
    
    // If reply, validate parent exists and is top-level
    let validParentId = null;
    if (parentId) {
      const parentComment = await prisma.blogComment.findFirst({
        where: { 
          id: parseInt(parentId), 
          blogPostId: blogId,
          parentId: null, // Can only reply to top-level comments
          status: 'VISIBLE'
        }
      });
      
      if (!parentComment) {
        return res.status(400).json({ error: 'Parent comment not found or cannot reply to nested comments' });
      }
      
      validParentId = parseInt(parentId);
    }
    
    // Create comment
    const comment = await prisma.blogComment.create({
      data: {
        blogPostId: blogId,
        userId,
        parentId: validParentId,
        content: content.trim(),
        isAuthorReply: userId === blog.authorId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            role: true
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.updateMany({
      where: { userId },
      data: { totalComments: { increment: 1 } }
    });
    
    // TODO: Send notification to blog author (if not self)
    if (userId !== blog.authorId) {
      // Create notification
      await prisma.notification.create({
        data: {
          userId: blog.authorId,
          type: 'BLOG_COMMENT',
          title: 'New comment on your blog',
          message: `${comment.user.name} commented on your blog`,
          data: {
            blogId,
            commentId: comment.id
          }
        }
      }).catch(console.error);
    }
    
    res.status(201).json({ 
      comment: {
        ...comment,
        isAuthorReply: userId === blog.authorId
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

/**
 * Edit comment (within 15 minutes)
 * PUT /api/comments/:id
 */
export const editComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    
    // Validate content
    if (!content || content.trim().length < 2) {
      return res.status(400).json({ error: 'Comment must be at least 2 characters' });
    }
    
    // Get comment
    const comment = await prisma.blogComment.findFirst({
      where: { id: commentId, userId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if within edit window (15 minutes)
    const editWindowMs = 15 * 60 * 1000;
    const timeSinceCreation = Date.now() - new Date(comment.createdAt).getTime();
    
    if (timeSinceCreation > editWindowMs) {
      return res.status(400).json({ error: 'Edit window expired (15 minutes)' });
    }
    
    // Update comment
    const updatedComment = await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            role: true
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });
    
    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
};

/**
 * Delete own comment
 * DELETE /api/comments/:id
 */
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    
    // Get comment
    const comment = await prisma.blogComment.findFirst({
      where: { id: commentId, userId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Delete comment (cascades to replies)
    await prisma.blogComment.delete({
      where: { id: commentId }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.updateMany({
      where: { userId },
      data: { totalComments: { decrement: 1 } }
    });
    
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

/**
 * Like/Unlike comment
 * POST /api/comments/:id/like
 */
export const toggleCommentLike = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    
    // Check if comment exists
    const comment = await prisma.blogComment.findFirst({
      where: { id: commentId, status: 'VISIBLE' }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check existing like
    const existingLike = await prisma.blogCommentLike.findUnique({
      where: {
        commentId_userId: { commentId, userId }
      }
    });
    
    if (existingLike) {
      // Unlike
      await prisma.blogCommentLike.delete({
        where: { id: existingLike.id }
      });
      
      res.json({ liked: false });
    } else {
      // Like
      await prisma.blogCommentLike.create({
        data: { commentId, userId }
      });
      
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

/**
 * Flag/Report comment
 * POST /api/comments/:id/flag
 */
export const flagComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    const { reason } = req.body;
    
    // Get comment
    const comment = await prisma.blogComment.findFirst({
      where: { id: commentId, status: 'VISIBLE' }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if already flagged by this user
    if (comment.flaggedBy.includes(userId)) {
      return res.status(400).json({ error: 'You have already flagged this comment' });
    }
    
    // Update flag count
    await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        flagCount: { increment: 1 },
        flaggedBy: { push: userId },
        status: comment.flagCount >= 2 ? 'FLAGGED' : 'VISIBLE' // Auto-flag after 3 reports
      }
    });
    
    // Create abuse report for admin review
    await prisma.abuseReport.create({
      data: {
        reporterId: userId,
        targetType: 'BLOG_COMMENT',
        targetId: commentId,
        reason: reason || 'Inappropriate content'
      }
    });
    
    res.json({ message: 'Comment flagged for review' });
  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({ error: 'Failed to flag comment' });
  }
};


// ==================== HOST/AUTHOR ENDPOINTS ====================

/**
 * Hide comment on own blog
 * POST /api/host/blogs/:blogId/comments/:commentId/hide
 */
export const hideComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const blogId = parseInt(req.params.blogId);
    const commentId = parseInt(req.params.commentId);
    const { reason } = req.body;
    
    // Verify blog ownership
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }
    
    // Get comment
    const comment = await prisma.blogComment.findFirst({
      where: { id: commentId, blogPostId: blogId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Hide comment
    await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        status: 'HIDDEN',
        hiddenBy: userId,
        hiddenAt: new Date(),
        hiddenReason: reason || 'Hidden by blog author'
      }
    });
    
    res.json({ message: 'Comment hidden' });
  } catch (error) {
    console.error('Hide comment error:', error);
    res.status(500).json({ error: 'Failed to hide comment' });
  }
};

/**
 * Unhide comment on own blog
 * POST /api/host/blogs/:blogId/comments/:commentId/unhide
 */
export const unhideComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const blogId = parseInt(req.params.blogId);
    const commentId = parseInt(req.params.commentId);
    
    // Verify blog ownership
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }
    
    // Unhide comment
    await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        status: 'VISIBLE',
        hiddenBy: null,
        hiddenAt: null,
        hiddenReason: null
      }
    });
    
    res.json({ message: 'Comment restored' });
  } catch (error) {
    console.error('Unhide comment error:', error);
    res.status(500).json({ error: 'Failed to unhide comment' });
  }
};


export default {
  // Public
  getBlogComments,
  
  // User
  addComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  flagComment,
  
  // Host/Author
  hideComment,
  unhideComment
};