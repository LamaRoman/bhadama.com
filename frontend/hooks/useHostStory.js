// ==========================================
// USE HOST STORY HOOK
// ==========================================
// File: hooks/useHostStory.js
//
// React hook for managing host story operations
// ==========================================

"use client";

import { useState, useCallback } from "react";
import api from "@/utils/api";

// ==========================================
// HOOK: useHostStory (for host's own story)
// ==========================================

export function useHostStory() {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch host's own story
  const fetchStory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/host/story");
      setStory(response.data.data);
      return response.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        setStory(null);
        return null;
      }
      setError(err.response?.data?.message || "Failed to fetch story");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if story exists
  const checkStoryExists = useCallback(async () => {
    try {
      const response = await api.get("/host/story/check");
      return response.data.data;
    } catch (err) {
      return { exists: false, status: null };
    }
  }, []);

  // Create new story
  const createStory = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/host/story", data);
      setStory(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create story");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update story
  const updateStory = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put("/host/story", data);
      setStory(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update story");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit for review
  const submitForReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch("/host/story/submit");
      setStory(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit story");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    story,
    loading,
    error,
    fetchStory,
    checkStoryExists,
    createStory,
    updateStory,
    submitForReview,
  };
}

// ==========================================
// HOOK: usePublicHostStory (for viewing any host's story)
// ==========================================

export function usePublicHostStory() {
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch public story by host ID
  const fetchStory = useCallback(async (hostId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/hosts/${hostId}/story`);
      setStory(response.data.data);
      return response.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        setStory(null);
        setError("Story not found");
        return null;
      }
      setError(err.response?.data?.message || "Failed to fetch story");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch featured stories
  const fetchFeaturedStories = useCallback(async (limit = 6) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/hosts/stories/featured?limit=${limit}`);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch featured stories");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    story,
    loading,
    error,
    fetchStory,
    fetchFeaturedStories,
  };
}

// ==========================================
// DEFAULT EXPORT
// ==========================================

export default {
  useHostStory,
  usePublicHostStory,
};