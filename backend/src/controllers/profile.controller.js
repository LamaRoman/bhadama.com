import * as profileService from "../services/profileService.js";

/**
 * Get current user's profile
 * GET /api/profile
 */
export async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = await profileService.getProfileById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * Update current user's profile
 * PUT /api/profile
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user = await profileService.updateProfile(userId, req.body);
    res.json({ user });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(400).json({ error: err.message || "Failed to update profile" });
  }
}

/**
 * Get current user's statistics
 * GET /api/profile/stats
 */
export async function getProfileStats(req, res) {
  try {
    const userId = req.user.userId;
    const stats = await profileService.getUserStats(userId);
    res.json({ stats });
  } catch (err) {
    console.error("GET PROFILE STATS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}