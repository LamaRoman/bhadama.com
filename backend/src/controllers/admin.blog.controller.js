// controllers/adminBlogController.js
// Admin moderation for blogs and comments

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== BLOG MODERATION ====================

/**
 * Get all blogs for moderation
 * GET /api/admin/blogs
 */
export const getAllBlogs = async (req, res) => {
  try {
    const { 
      status, 
      category,
      authorType,
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (authorType) {
      where.authorType = authorType;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { name: { contains: search, mode: 'insensitive' } } },
        { author: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    const [blogs, total, pending] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true
            }
          },
          listing: {
            select: { id: true, title: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.count({ where: { status: 'PENDING' } })
    ]);
    
    res.json({
      blogs,
      pendingCount: pending,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

/**
 * Get pending blogs for approval
 * GET /api/admin/blogs/pending
 */
export const getPendingBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: 'PENDING' },
        skip,
        take,
        orderBy: { createdAt: 'asc' }, // Oldest first (FIFO)
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              contributorProfile: {
                select: {
                  tier: true,
                  publishedBlogs: true,
                  rejectedBlogs: true
                }
              }
            }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.blogPost.count({ where: { status: 'PENDING' } })
    ]);
    
    res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get pending blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch pending blogs' });
  }
};

/**
 * Get single blog for review
 * GET /api/admin/blogs/:id
 */
export const getBlogForReview = async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    
    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePhoto: true,
            createdAt: true,
            contributorProfile: true,
            _count: {
              select: {
                blogPosts: true,
                bookings: true
              }
            }
          }
        },
        listing: {
          select: { id: true, title: true, slug: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({ blog });
  } catch (error) {
    console.error('Get blog for review error:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

/**
 * Approve blog
 * POST /api/admin/blogs/:id/approve
 */
export const approveBlog = async (req, res) => {
  try {
    const adminId = req.user.id;
    const blogId = parseInt(req.params.id);
    const { adminNote } = req.body;
    
    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      select: { id: true, status: true, authorId: true, title: true }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status !== 'PENDING') {
      return res.status(400).json({ error: 'Blog is not pending approval' });
    }
    
    // Approve and publish
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        moderatedBy: adminId,
        moderatedAt: new Date(),
        adminNote
      }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.updateMany({
      where: { userId: blog.authorId },
      data: { 
        publishedBlogs: { increment: 1 },
        approvedComments: { increment: 1 }
      }
    });
    
    // Check if user should be upgraded to Tier 3
    const profile = await prisma.contributorProfile.findUnique({
      where: { userId: blog.authorId }
    });
    
    if (profile && profile.tier === 2 && profile.publishedBlogs >= 3) {
      await prisma.contributorProfile.update({
        where: { userId: blog.authorId },
        data: {
          tier: 3,
          previousTier: 2,
          tierUpdatedAt: new Date()
        }
      });
    }
    
    // Send notification to author
    await prisma.notification.create({
      data: {
        userId: blog.authorId,
        type: 'BLOG_APPROVED',
        title: 'Blog Approved! 🎉',
        message: `Your blog "${blog.title}" has been approved and published.`,
        data: { blogId }
      }
    }).catch(console.error);
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BLOG_APPROVED',
        entity: 'BlogPost',
        entityId: blogId,
        after: { status: 'PUBLISHED' }
      }
    }).catch(console.error);
    
    res.json({ blog: updatedBlog, message: 'Blog approved and published' });
  } catch (error) {
    console.error('Approve blog error:', error);
    res.status(500).json({ error: 'Failed to approve blog' });
  }
};

/**
 * Reject blog
 * POST /api/admin/blogs/:id/reject
 */
export const rejectBlog = async (req, res) => {
  try {
    const adminId = req.user.id;
    const blogId = parseInt(req.params.id);
    const { reason, adminNote } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      select: { id: true, status: true, authorId: true, title: true }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Reject blog
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        adminNote
      }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.updateMany({
      where: { userId: blog.authorId },
      data: { rejectedBlogs: { increment: 1 } }
    });
    
    // Send notification to author
    await prisma.notification.create({
      data: {
        userId: blog.authorId,
        type: 'BLOG_REJECTED',
        title: 'Blog Not Approved',
        message: `Your blog "${blog.title}" was not approved. Reason: ${reason}`,
        data: { blogId, reason }
      }
    }).catch(console.error);
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BLOG_REJECTED',
        entity: 'BlogPost',
        entityId: blogId,
        after: { status: 'REJECTED', reason }
      }
    }).catch(console.error);
    
    res.json({ blog: updatedBlog, message: 'Blog rejected' });
  } catch (error) {
    console.error('Reject blog error:', error);
    res.status(500).json({ error: 'Failed to reject blog' });
  }
};

/**
 * Feature/Unfeature blog
 * POST /api/admin/blogs/:id/feature
 */
export const toggleFeature = async (req, res) => {
  try {
    const adminId = req.user.id;
    const blogId = parseInt(req.params.id);
    const { featured, featuredUntil } = req.body;
    
    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Only published blogs can be featured' });
    }
    
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: {
        isFeatured: featured,
        featuredUntil: featured && featuredUntil ? new Date(featuredUntil) : null
      }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: featured ? 'BLOG_FEATURED' : 'BLOG_UNFEATURED',
        entity: 'BlogPost',
        entityId: blogId
      }
    }).catch(console.error);
    
    res.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Toggle feature error:', error);
    res.status(500).json({ error: 'Failed to update feature status' });
  }
};

/**
 * Delete blog (admin)
 * DELETE /api/admin/blogs/:id
 */
export const deleteBlog = async (req, res) => {
  try {
    const adminId = req.user.id;
    const blogId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const blog = await prisma.blogPost.findUnique({
      where: { id: blogId },
      select: { id: true, title: true, authorId: true, status: true }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Delete blog
    await prisma.blogPost.delete({
      where: { id: blogId }
    });
    
    // Update contributor stats
    const updateData = { totalBlogs: { decrement: 1 } };
    if (blog.status === 'PUBLISHED') {
      updateData.publishedBlogs = { decrement: 1 };
    }
    
    await prisma.contributorProfile.updateMany({
      where: { userId: blog.authorId },
      data: updateData
    });
    
    // Notify author
    await prisma.notification.create({
      data: {
        userId: blog.authorId,
        type: 'SYSTEM',
        title: 'Blog Removed',
        message: `Your blog "${blog.title}" has been removed by an administrator.${reason ? ` Reason: ${reason}` : ''}`,
        data: { reason }
      }
    }).catch(console.error);
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'BLOG_DELETED',
        entity: 'BlogPost',
        entityId: blogId,
        before: { title: blog.title, authorId: blog.authorId },
        after: { reason }
      }
    }).catch(console.error);
    
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};


// ==================== COMMENT MODERATION ====================

/**
 * Get flagged comments
 * GET /api/admin/comments/flagged
 */
export const getFlaggedComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const [comments, total] = await Promise.all([
      prisma.blogComment.findMany({
        where: { status: 'FLAGGED' },
        skip,
        take,
        orderBy: { flagCount: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true
            }
          },
          blogPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              authorId: true
            }
          }
        }
      }),
      prisma.blogComment.count({ where: { status: 'FLAGGED' } })
    ]);
    
    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get flagged comments error:', error);
    res.status(500).json({ error: 'Failed to fetch flagged comments' });
  }
};

/**
 * Approve flagged comment (restore to visible)
 * POST /api/admin/comments/:id/approve
 */
export const approveComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    
    await prisma.blogComment.update({
      where: { id: commentId },
      data: {
        status: 'VISIBLE',
        flagCount: 0,
        flaggedBy: []
      }
    });
    
    // Resolve related abuse reports
    await prisma.abuseReport.updateMany({
      where: {
        targetType: 'BLOG_COMMENT',
        targetId: commentId,
        resolved: false
      },
      data: { resolved: true, adminId: req.user.id }
    });
    
    res.json({ message: 'Comment approved' });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ error: 'Failed to approve comment' });
  }
};

/**
 * Delete flagged comment
 * DELETE /api/admin/comments/:id
 */
export const deleteComment = async (req, res) => {
  try {
    const adminId = req.user.id;
    const commentId = parseInt(req.params.id);
    
    const comment = await prisma.blogComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, content: true }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    await prisma.blogComment.delete({
      where: { id: commentId }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.updateMany({
      where: { userId: comment.userId },
      data: { totalComments: { decrement: 1 } }
    });
    
    // Resolve related abuse reports
    await prisma.abuseReport.updateMany({
      where: {
        targetType: 'BLOG_COMMENT',
        targetId: commentId,
        resolved: false
      },
      data: { resolved: true, adminId }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'COMMENT_DELETED',
        entity: 'BlogComment',
        entityId: commentId,
        before: { userId: comment.userId, content: comment.content.substring(0, 100) }
      }
    }).catch(console.error);
    
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};


// ==================== CONTRIBUTOR MANAGEMENT ====================

/**
 * Get all contributors
 * GET /api/admin/contributors
 */
export const getContributors = async (req, res) => {
  try {
    const { tier, banned, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    
    if (tier !== undefined) {
      where.tier = parseInt(tier);
    }
    
    if (banned !== undefined) {
      where.isBanned = banned === 'true';
    }
    
    const [contributors, total] = await Promise.all([
      prisma.contributorProfile.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profilePhoto: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.contributorProfile.count({ where })
    ]);
    
    res.json({
      contributors,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get contributors error:', error);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
};

/**
 * Update contributor tier
 * PUT /api/admin/contributors/:userId/tier
 */
export const updateContributorTier = async (req, res) => {
  try {
    const adminId = req.user.id;
    const userId = parseInt(req.params.userId);
    const { tier } = req.body;
    
    if (tier < 0 || tier > 3) {
      return res.status(400).json({ error: 'Tier must be between 0 and 3' });
    }
    
    const profile = await prisma.contributorProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const updatedProfile = await prisma.contributorProfile.update({
      where: { userId },
      data: {
        tier,
        previousTier: profile.tier,
        tierUpdatedAt: new Date()
      }
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'CONTRIBUTOR_TIER_UPDATED',
        entity: 'ContributorProfile',
        entityId: profile.id,
        before: { tier: profile.tier },
        after: { tier }
      }
    }).catch(console.error);
    
    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Update tier error:', error);
    res.status(500).json({ error: 'Failed to update tier' });
  }
};

/**
 * Ban/Unban contributor
 * POST /api/admin/contributors/:userId/ban
 */
export const toggleContributorBan = async (req, res) => {
  try {
    const adminId = req.user.id;
    const userId = parseInt(req.params.userId);
    const { ban, reason } = req.body;
    
    const profile = await prisma.contributorProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const updatedProfile = await prisma.contributorProfile.update({
      where: { userId },
      data: {
        isBanned: ban,
        bannedAt: ban ? new Date() : null,
        bannedReason: ban ? reason : null,
        bannedBy: ban ? adminId : null
      }
    });
    
    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: ban ? 'Blog Privileges Suspended' : 'Blog Privileges Restored',
        message: ban 
          ? `Your blog writing privileges have been suspended.${reason ? ` Reason: ${reason}` : ''}`
          : 'Your blog writing privileges have been restored.',
        data: { reason }
      }
    }).catch(console.error);
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId,
        action: ban ? 'CONTRIBUTOR_BANNED' : 'CONTRIBUTOR_UNBANNED',
        entity: 'ContributorProfile',
        entityId: profile.id,
        after: { ban, reason }
      }
    }).catch(console.error);
    
    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ error: 'Failed to update ban status' });
  }
};


// ==================== BLOG STATISTICS ====================

/**
 * Get blog statistics
 * GET /api/admin/blogs/stats
 */
export const getBlogStats = async (req, res) => {
  try {
    const [
      totalBlogs,
      publishedBlogs,
      pendingBlogs,
      draftBlogs,
      rejectedBlogs,
      totalComments,
      flaggedComments,
      totalLikes,
      totalViews,
      contributorsByTier
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.blogPost.count({ where: { status: 'PENDING' } }),
      prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      prisma.blogPost.count({ where: { status: 'REJECTED' } }),
      prisma.blogComment.count(),
      prisma.blogComment.count({ where: { status: 'FLAGGED' } }),
      prisma.blogLike.count(),
      prisma.blogPost.aggregate({ _sum: { viewCount: true } }),
      prisma.contributorProfile.groupBy({
        by: ['tier'],
        _count: { tier: true }
      })
    ]);
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentBlogs, recentComments] = await Promise.all([
      prisma.blogPost.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      prisma.blogComment.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      })
    ]);
    
    res.json({
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
        pending: pendingBlogs,
        draft: draftBlogs,
        rejected: rejectedBlogs
      },
      engagement: {
        comments: totalComments,
        flaggedComments,
        likes: totalLikes,
        views: totalViews._sum.viewCount || 0
      },
      contributors: contributorsByTier.reduce((acc, item) => {
        acc[`tier${item.tier}`] = item._count.tier;
        return acc;
      }, {}),
      recentActivity: {
        blogsLast7Days: recentBlogs,
        commentsLast7Days: recentComments
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};


export default {
  // Blog moderation
  getAllBlogs,
  getPendingBlogs,
  getBlogForReview,
  approveBlog,
  rejectBlog,
  toggleFeature,
  deleteBlog,
  
  // Comment moderation
  getFlaggedComments,
  approveComment,
  deleteComment,
  
  // Contributor management
  getContributors,
  updateContributorTier,
  toggleContributorBan,
  
  // Statistics
  getBlogStats
};