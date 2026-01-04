// At the top of the file, update the getContributorProfile function
const getContributorProfile = async (userId) => {
  // Make sure userId is a number
  const numericUserId = Number(userId);
  
  let profile = await prisma.contributorProfile.findUnique({
    where: { userId: numericUserId }
  });
  
  if (!profile) {
    // Create new profile
    const user = await prisma.user.findUnique({
      where: { id: numericUserId },
      include: {
        bookings: { where: { status: 'COMPLETED' } }
      }
    });
    
    // ... rest of the tier logic ...
    
    profile = await prisma.contributorProfile.create({
      data: {
        userId: numericUserId,
        tier: initialTier
      }
    });
  }
  
  return profile;
};

// Then update all the endpoint functions:

export const getUserBlogs = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    // ... rest of the function
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

export const getContributorProfileEndpoint = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    // ... rest of the function
  } catch (error) {
    console.error('Get contributor profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const createBlog = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const userRole = req.user.role;
    
    // ... rest of the function
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

export const publishBlog = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const userRole = req.user.role;
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Publish blog error:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
};

export const unpublishBlog = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Unpublish blog error:', error);
    res.status(500).json({ error: 'Failed to unpublish blog' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

export const toggleBlogLike = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

export const getBlogLikeStatus = async (req, res) => {
  try {
    const userId = Number(req.user.userId); // Changed from req.user.id
    const blogId = parseInt(req.params.id);
    
    // ... rest of the function
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ error: 'Failed to get like status' });
  }
};

export const getHostBlogs = async (req, res) => {
  try {
    const hostId = Number(req.user.userId); // Changed from req.user.id
    const { status, page = 1, limit = 10 } = req.query;
    
    // ... rest of the function
  } catch (error) {
    console.error('Get host blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};