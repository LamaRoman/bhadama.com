// controllers/blogController.js
// Blog CRUD operations with SEO validation and tier-based publishing

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate URL-friendly slug from title
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
};

/**
 * Ensure slug is unique
 */
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!existing || existing.id === excludeId) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Count words in HTML content
 */
const countWords = (htmlContent) => {
  if (!htmlContent) return 0;
  
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  // Count words
  return cleaned ? cleaned.split(' ').length : 0;
};

/**
 * Calculate reading time (avg 200 words per minute)
 */
const calculateReadingTime = (wordCount) => {
  return Math.ceil(wordCount / 200);
};

/**
 * Generate excerpt from content
 */
const generateExcerpt = (htmlContent, maxLength = 300) => {
  if (!htmlContent) return '';
  
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

/**
 * Calculate SEO score (0-100)
 */
const calculateSeoScore = (blog) => {
  let score = 0;
  
  // Title (20 points)
  if (blog.title) {
    score += 10;
    if (blog.title.length >= 50 && blog.title.length <= 60) score += 5;
    if (blog.focusKeyword && blog.title.toLowerCase().includes(blog.focusKeyword.toLowerCase())) score += 5;
  }
  
  // Meta description (15 points)
  if (blog.metaDescription) {
    score += 5;
    if (blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160) score += 5;
    if (blog.focusKeyword && blog.metaDescription.toLowerCase().includes(blog.focusKeyword.toLowerCase())) score += 5;
  }
  
  // Content (35 points)
  if (blog.wordCount >= 500) score += 10;
  if (blog.wordCount >= 800) score += 5;
  if (blog.wordCount >= 1500) score += 5;
  if (blog.content && blog.content.includes('<h2')) score += 5;
  if (blog.content && blog.content.includes('<h3')) score += 3;
  if (blog.content && blog.content.includes('<img')) score += 5;
  if (blog.content && blog.content.includes('<a')) score += 2;
  
  // Media (15 points)
  if (blog.coverImage) score += 10;
  if (blog.coverImageAlt) score += 5;
  
  // Structure (15 points)
  if (blog.category && blog.category !== 'GENERAL') score += 5;
  if (blog.tags && blog.tags.length >= 2) score += 5;
  if (blog.excerpt) score += 5;
  
  return Math.min(score, 100);
};

/**
 * Validate blog for publishing
 */
const validateForPublish = (blog) => {
  const errors = [];
  
  if (!blog.title || blog.title.trim().length < 10) {
    errors.push('Title must be at least 10 characters');
  }
  
  if (blog.wordCount < 500) {
    errors.push(`Content must be at least 500 words (currently ${blog.wordCount})`);
  }
  
  if (!blog.metaDescription || blog.metaDescription.length < 50) {
    errors.push('Meta description is required (at least 50 characters)');
  }
  
  if (!blog.coverImage) {
    errors.push('Cover image is required');
  }
  
  if (!blog.category) {
    errors.push('Category is required');
  }
  
  if (!blog.tags || blog.tags.length < 2) {
    errors.push('At least 2 tags are required');
  }
  
  return errors;
};

/**
 * Get or create contributor profile
 */
const getContributorProfile = async (userId) => {
  let profile = await prisma.contributorProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) {
    // Create new profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: { where: { status: 'COMPLETED' } }
      }
    });
    
    // Determine initial tier based on role and activity
    let initialTier = 0;
    
    if (user.role === 'HOST') {
      initialTier = 3; // Hosts are trusted
    } else if (user.role === 'ADMIN') {
      initialTier = 3; // Admins are trusted
    } else if (user.bookings.length >= 2) {
      initialTier = 2; // Users with 2+ bookings can write (pending approval)
    } else if (user.isVerified || user.bookings.length >= 1) {
      initialTier = 1; // Basic users
    }
    
    profile = await prisma.contributorProfile.create({
      data: {
        userId,
        tier: initialTier
      }
    });
  }
  
  return profile;
};


// ==================== PUBLIC ENDPOINTS ====================

/**
 * Get all published blogs (public)
 * GET /api/blogs
 */
export const getPublishedBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      tag,
      authorType,
      search,
      sort = 'newest'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build where clause
    const where = {
      status: 'PUBLISHED'
    };
    
    if (category) {
      where.category = category;
    }
    
    if (tag) {
      where.tags = { has: tag };
    }
    
    if (authorType) {
      where.authorType = authorType;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }
    
    // Sort order
    let orderBy = { publishedAt: 'desc' };
    switch (sort) {
      case 'oldest':
        orderBy = { publishedAt: 'asc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'mostLiked':
        orderBy = { likes: { _count: 'desc' } };
        break;
    }
    
    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          coverImageAlt: true,
          category: true,
          tags: true,
          authorType: true,
          publishedAt: true,
          viewCount: true,
          readingTime: true,
          author: {
            select: {
              id: true,
              name: true,
              profilePhoto: true
            }
          },
          listing: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: { where: { status: 'VISIBLE' } }
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
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
    console.error('Get blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

/**
 * Get single blog by slug (public)
 * GET /api/blogs/:slug
 */
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const blog = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true,
            bio: true,
            role: true,
            _count: {
              select: {
                blogPosts: { where: { status: 'PUBLISHED' } }
              }
            }
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            images: { take: 1, orderBy: { order: 'asc' } }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { status: 'VISIBLE' } }
          }
        }
      }
    });
    
    if (!blog || blog.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment view count (async, don't wait)
    prisma.blogPost.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } }
    }).catch(console.error);
    
    // Get related blogs
    const relatedBlogs = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: blog.id },
        OR: [
          { category: blog.category },
          { tags: { hasSome: blog.tags } }
        ]
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        readingTime: true,
        author: {
          select: {
            name: true,
            profilePhoto: true
          }
        }
      }
    });
    
    res.json({ blog, relatedBlogs });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

/**
 * Get featured blogs
 * GET /api/blogs/featured
 */
export const getFeaturedBlogs = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const blogs = await prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        isFeatured: true,
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gte: new Date() } }
        ]
      },
      take: parseInt(limit),
      orderBy: [
        { featuredUntil: 'desc' },
        { publishedAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        coverImageAlt: true,
        category: true,
        publishedAt: true,
        readingTime: true,
        author: {
          select: {
            id: true,
            name: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { status: 'VISIBLE' } }
          }
        }
      }
    });
    
    res.json({ blogs });
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
};

/**
 * Get blog categories with counts
 * GET /api/blogs/categories
 */
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await prisma.blogPost.groupBy({
      by: ['category'],
      where: { status: 'PUBLISHED' },
      _count: { category: true }
    });
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

/**
 * Get popular tags
 * GET /api/blogs/tags
 */
export const getPopularTags = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get all tags from published blogs
    const blogs = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true }
    });
    
    // Count tag occurrences
    const tagCounts = {};
    blogs.forEach(blog => {
      blog.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Sort and limit
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([tag, count]) => ({ tag, count }));
    
    res.json({ tags: sortedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};


// ==================== AUTHENTICATED USER ENDPOINTS ====================

/**
 * Get user's own blogs
 * GET /api/user/blogs
 */
export const getUserBlogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = { authorId: userId };
    if (status) {
      where.status = status;
    }
    
    const [blogs, total, profile] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          category: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          wordCount: true,
          seoScore: true,
          viewCount: true,
          rejectionReason: true,
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where }),
      getContributorProfile(userId)
    ]);
    
    res.json({
      blogs,
      profile,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

/**
 * Get contributor profile
 * GET /api/user/contributor-profile
 */
export const getContributorProfileEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getContributorProfile(userId);
    
    // Calculate progress to next tier
    let nextTierProgress = null;
    if (profile.tier < 3) {
      if (profile.tier === 0 || profile.tier === 1) {
        // Need 2 completed bookings or 5 approved comments
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            bookings: { where: { status: 'COMPLETED' } },
            blogComments: { where: { status: 'VISIBLE' } }
          }
        });
        
        nextTierProgress = {
          bookings: { current: user.bookings.length, required: 2 },
          comments: { current: user.blogComments.length, required: 5 }
        };
      } else if (profile.tier === 2) {
        // Need 3 approved blogs
        nextTierProgress = {
          publishedBlogs: { current: profile.publishedBlogs, required: 3 }
        };
      }
    }
    
    res.json({ profile, nextTierProgress });
  } catch (error) {
    console.error('Get contributor profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * Create new blog
 * POST /api/user/blogs
 */
export const createBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Check contributor profile and tier
    const profile = await getContributorProfile(userId);
    
    if (profile.tier < 2 && userRole === 'USER') {
      return res.status(403).json({ 
        error: 'You need to complete 2 bookings or have 5 approved comments to write blogs',
        tier: profile.tier
      });
    }
    
    if (profile.isBanned) {
      return res.status(403).json({ error: 'You are banned from writing blogs' });
    }
    
    const {
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      focusKeyword,
      coverImage,
      coverImageAlt,
      category,
      tags,
      listingId,
      allowComments = true,
      status = 'DRAFT'
    } = req.body;
    
    // Validate required fields
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: 'Title is required (at least 5 characters)' });
    }
    
    // Generate slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);
    
    // Calculate metrics
    const wordCount = countWords(content);
    const readingTime = calculateReadingTime(wordCount);
    const finalExcerpt = excerpt || generateExcerpt(content);
    
    // Prepare blog data
    const blogData = {
      authorId: userId,
      authorType: userRole,
      title: title.trim(),
      slug,
      content: content || '',
      excerpt: finalExcerpt,
      metaTitle: metaTitle || title.substring(0, 60),
      metaDescription,
      focusKeyword,
      coverImage,
      coverImageAlt,
      category: category || 'GENERAL',
      tags: tags || [],
      allowComments,
      wordCount,
      readingTime,
      status: 'DRAFT' // Always start as draft
    };
    
    // Calculate SEO score
    blogData.seoScore = calculateSeoScore(blogData);
    
    // If listing link, verify host owns it
    if (listingId && userRole === 'HOST') {
      const listing = await prisma.listing.findFirst({
        where: { id: parseInt(listingId), hostId: userId }
      });
      
      if (listing) {
        blogData.listingId = parseInt(listingId);
      }
    }
    
    const blog = await prisma.blogPost.create({
      data: blogData,
      include: {
        author: {
          select: { id: true, name: true, profilePhoto: true }
        }
      }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.update({
      where: { userId },
      data: { totalBlogs: { increment: 1 } }
    });
    
    res.status(201).json({ blog });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

/**
 * Update blog
 * PUT /api/user/blogs/:id
 */
export const updateBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    // Verify ownership
    const existingBlog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Can't edit published blogs (must unpublish first)
    if (existingBlog.status === 'PUBLISHED') {
      return res.status(400).json({ 
        error: 'Cannot edit published blog. Please unpublish first.' 
      });
    }
    
    const {
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      focusKeyword,
      coverImage,
      coverImageAlt,
      category,
      tags,
      listingId,
      allowComments
    } = req.body;
    
    // Generate new slug if title changed
    let slug = existingBlog.slug;
    if (title && title !== existingBlog.title) {
      const baseSlug = generateSlug(title);
      slug = await ensureUniqueSlug(baseSlug, blogId);
    }
    
    // Calculate metrics
    const wordCount = countWords(content || existingBlog.content);
    const readingTime = calculateReadingTime(wordCount);
    const finalExcerpt = excerpt || generateExcerpt(content || existingBlog.content);
    
    // Prepare update data
    const updateData = {
      title: title?.trim() || existingBlog.title,
      slug,
      content: content !== undefined ? content : existingBlog.content,
      excerpt: finalExcerpt,
      metaTitle: metaTitle || existingBlog.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : existingBlog.metaDescription,
      focusKeyword: focusKeyword !== undefined ? focusKeyword : existingBlog.focusKeyword,
      coverImage: coverImage !== undefined ? coverImage : existingBlog.coverImage,
      coverImageAlt: coverImageAlt !== undefined ? coverImageAlt : existingBlog.coverImageAlt,
      category: category || existingBlog.category,
      tags: tags !== undefined ? tags : existingBlog.tags,
      allowComments: allowComments !== undefined ? allowComments : existingBlog.allowComments,
      wordCount,
      readingTime,
      status: 'DRAFT' // Reset to draft on edit
    };
    
    // Calculate SEO score
    updateData.seoScore = calculateSeoScore(updateData);
    
    // Handle listing link
    if (listingId !== undefined) {
      if (listingId === null) {
        updateData.listingId = null;
      } else if (req.user.role === 'HOST') {
        const listing = await prisma.listing.findFirst({
          where: { id: parseInt(listingId), hostId: userId }
        });
        if (listing) {
          updateData.listingId = parseInt(listingId);
        }
      }
    }
    
    const blog = await prisma.blogPost.update({
      where: { id: blogId },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, profilePhoto: true }
        }
      }
    });
    
    res.json({ blog });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

/**
 * Submit blog for publishing
 * POST /api/user/blogs/:id/publish
 */
export const publishBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const blogId = parseInt(req.params.id);
    
    // Get blog and profile
    const [blog, profile] = await Promise.all([
      prisma.blogPost.findFirst({
        where: { id: blogId, authorId: userId }
      }),
      getContributorProfile(userId)
    ]);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Blog is already published' });
    }
    
    // Validate for publishing
    const validationErrors = validateForPublish(blog);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Blog does not meet publishing requirements',
        validationErrors 
      });
    }
    
    // Determine if auto-publish or needs approval
    const canAutoPublish = 
      userRole === 'HOST' || 
      userRole === 'ADMIN' || 
      profile.tier >= 3;
    
    const newStatus = canAutoPublish ? 'PUBLISHED' : 'PENDING';
    
    const updateData = {
      status: newStatus
    };
    
    if (newStatus === 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }
    
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: updateData
    });
    
    // Update contributor stats if published
    if (newStatus === 'PUBLISHED') {
      await prisma.contributorProfile.update({
        where: { userId },
        data: { publishedBlogs: { increment: 1 } }
      });
    }
    
    res.json({ 
      blog: updatedBlog,
      message: newStatus === 'PUBLISHED' 
        ? 'Blog published successfully!' 
        : 'Blog submitted for review. We will notify you once approved.'
    });
  } catch (error) {
    console.error('Publish blog error:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
};

/**
 * Unpublish blog (revert to draft)
 * POST /api/user/blogs/:id/unpublish
 */
export const unpublishBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Blog is not published' });
    }
    
    const updatedBlog = await prisma.blogPost.update({
      where: { id: blogId },
      data: { 
        status: 'DRAFT',
        publishedAt: null
      }
    });
    
    // Update contributor stats
    await prisma.contributorProfile.update({
      where: { userId },
      data: { publishedBlogs: { decrement: 1 } }
    });
    
    res.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Unpublish blog error:', error);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
};

/**
 * Delete blog
 * DELETE /api/user/blogs/:id
 */
export const deleteBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, authorId: userId }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    await prisma.blogPost.delete({
      where: { id: blogId }
    });
    
    // Update contributor stats
    const updateData = { totalBlogs: { decrement: 1 } };
    if (blog.status === 'PUBLISHED') {
      updateData.publishedBlogs = { decrement: 1 };
    }
    
    await prisma.contributorProfile.update({
      where: { userId },
      data: updateData
    });
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

/**
 * Like/Unlike blog
 * POST /api/blogs/:id/like
 */
export const toggleBlogLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    // Check if blog exists and is published
    const blog = await prisma.blogPost.findFirst({
      where: { id: blogId, status: 'PUBLISHED' }
    });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Check existing like
    const existingLike = await prisma.blogLike.findUnique({
      where: {
        blogPostId_userId: { blogPostId: blogId, userId }
      }
    });
    
    if (existingLike) {
      // Unlike
      await prisma.blogLike.delete({
        where: { id: existingLike.id }
      });
      
      res.json({ liked: false, message: 'Blog unliked' });
    } else {
      // Like
      await prisma.blogLike.create({
        data: { blogPostId: blogId, userId }
      });
      
      // Update author's stats
      await prisma.contributorProfile.updateMany({
        where: { userId: blog.authorId },
        data: { totalLikesReceived: { increment: 1 } }
      });
      
      res.json({ liked: true, message: 'Blog liked' });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

/**
 * Check if user liked a blog
 * GET /api/blogs/:id/like-status
 */
export const getBlogLikeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const blogId = parseInt(req.params.id);
    
    const like = await prisma.blogLike.findUnique({
      where: {
        blogPostId_userId: { blogPostId: blogId, userId }
      }
    });
    
    res.json({ liked: !!like });
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ error: 'Failed to get like status' });
  }
};


// ==================== HOST-SPECIFIC ENDPOINTS ====================

/**
 * Get host's blogs with listing options
 * GET /api/host/blogs
 */
export const getHostBlogs = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = { authorId: hostId };
    if (status) {
      where.status = status;
    }
    
    const [blogs, total, listings] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            select: { id: true, title: true, slug: true }
          },
          _count: {
            select: { likes: true, comments: true }
          }
        }
      }),
      prisma.blogPost.count({ where }),
      // Get host's listings for linking
      prisma.listing.findMany({
        where: { hostId, status: 'ACTIVE' },
        select: { id: true, title: true, slug: true }
      })
    ]);
    
    res.json({
      blogs,
      listings,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get host blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};


export default {
  // Public
  getPublishedBlogs,
  getBlogBySlug,
  getFeaturedBlogs,
  getBlogCategories,
  getPopularTags,
  
  // User
  getUserBlogs,
  getContributorProfileEndpoint,
  createBlog,
  updateBlog,
  publishBlog,
  unpublishBlog,
  deleteBlog,
  toggleBlogLike,
  getBlogLikeStatus,
  
  // Host
  getHostBlogs
};