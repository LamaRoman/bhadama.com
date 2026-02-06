// hooks/useStory.js
// ==========================================
// STORY API HOOKS
// ==========================================
// Custom hooks for host story CRUD operations
// Routes:
//   - /api/host/story (authenticated host operations)
//   - /api/hosts/:hostId/story (public view)
//   - /api/hosts/stories/featured (featured stories)
//   - /api/admin/stories/* (admin moderation)
// ==========================================

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/utils/api';

// ==========================================
// HOST STORY HOOK (For Host Dashboard)
// ==========================================

/**
 * Hook for managing the authenticated host's personal story
 */
export const useHostStory = () => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exists, setExists] = useState(null);

  // Check if story exists
  const checkExists = useCallback(async () => {
    try {
      const response = await api('/api/host/story/check');
      setExists(response.data.exists);
      return response.data;
    } catch (err) {
      console.error('Failed to check story existence:', err);
      throw err;
    }
  }, []);

  // Fetch own story
  const fetchStory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api('/api/host/story');
      setStory(response.data);
      setExists(response.data !== null);
      return response.data;
    } catch (err) {
      // 404 or STORY_NOT_FOUND is expected if no story exists yet
      if (err.status === 404 || err.code === 'STORY_NOT_FOUND') {
        setStory(null);
        setExists(false);
        return null;
      }
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create story
  const createStory = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api('/api/host/story', {
        method: 'POST',
        body: data,
      });
      setStory(response.data);
      setExists(true);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update story
  const updateStory = async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api('/api/host/story', {
        method: 'PUT',
        body: data,
      });
      setStory(response.data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Submit for review
  const submitForReview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api('/api/host/story/submit', {
        method: 'PATCH',
      });
      setStory(response.data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Save or create (convenience method)
  const saveStory = async (data) => {
    if (exists) {
      return updateStory(data);
    } else {
      return createStory(data);
    }
  };

  return {
    story,
    loading,
    error,
    exists,
    checkExists,
    fetchStory,
    createStory,
    updateStory,
    submitForReview,
    saveStory,
    setStory,
  };
};

// ==========================================
// PUBLIC STORY HOOKS
// ==========================================

/**
 * Hook for fetching public story by host ID
 */
export const usePublicStory = () => {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStory = useCallback(async (hostId) => {
    if (!hostId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api(`/api/hosts/${hostId}/story`);
      setStory(response.data);
      return response.data;
    } catch (err) {
      if (err.status === 404 || err.code === 'STORY_NOT_FOUND') {
        setStory(null);
        return null;
      }
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { story, loading, error, fetchStory, setStory };
};

/**
 * Hook for fetching featured stories
 */
export const useFeaturedStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeatured = useCallback(async (limit = 6) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api(`/api/hosts/stories/featured?limit=${limit}`);
      setStories(response.data || []);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { stories, loading, error, fetchFeatured, setStories };
};

// ==========================================
// ADMIN STORY HOOKS
// ==========================================

/**
 * Hook for admin story moderation
 */
export const useAdminStories = () => {
  const [stories, setStories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch stories list
  const fetchStories = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      
      const query = queryParams.toString();
      const response = await api(`/api/admin/stories${query ? `?${query}` : ''}`);
      
      setStories(response.data || []);
      setPagination(response.pagination || null);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await api('/api/admin/stories/stats');
      setStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      throw err;
    }
  }, []);

  // Get single story for review
  const getStoryForReview = async (storyId) => {
    const response = await api(`/api/admin/stories/${storyId}`);
    return response.data;
  };

  // Approve story
  const approveStory = async (storyId) => {
    const response = await api(`/api/admin/stories/${storyId}/approve`, {
      method: 'PATCH',
    });
    
    setStories(prev => prev.map(s => 
      s.id === storyId ? { ...s, status: 'PUBLISHED' } : s
    ));
    
    return response;
  };

  // Reject story
  const rejectStory = async (storyId, rejectionReason) => {
    const response = await api(`/api/admin/stories/${storyId}/reject`, {
      method: 'PATCH',
      body: { rejectionReason },
    });
    
    setStories(prev => prev.map(s => 
      s.id === storyId ? { ...s, status: 'REJECTED', rejectionReason } : s
    ));
    
    return response;
  };

  // Unpublish story
  const unpublishStory = async (storyId, reason = null) => {
    const response = await api(`/api/admin/stories/${storyId}/unpublish`, {
      method: 'PATCH',
      body: { reason },
    });
    
    setStories(prev => prev.map(s => 
      s.id === storyId ? { ...s, status: 'PENDING' } : s
    ));
    
    return response;
  };

  // Delete story (Super Admin)
  const deleteStory = async (storyId) => {
    const response = await api(`/api/admin/stories/${storyId}`, {
      method: 'DELETE',
    });
    
    setStories(prev => prev.filter(s => s.id !== storyId));
    
    return response;
  };

  return {
    stories,
    pagination,
    stats,
    loading,
    error,
    fetchStories,
    fetchStats,
    getStoryForReview,
    approveStory,
    rejectStory,
    unpublishStory,
    deleteStory,
  };
};

/**
 * Hook for moderation settings (Super Admin)
 */
export const useModerationSettings = () => {
  const [settings, setSettings] = useState({ autoPublish: false });
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api('/api/admin/stories/settings');
      setSettings(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (autoPublish) => {
    setLoading(true);
    try {
      const response = await api('/api/admin/stories/settings', {
        method: 'PATCH',
        body: { autoPublish },
      });
      setSettings(response.data);
      return response;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, fetchSettings, updateSettings };
};