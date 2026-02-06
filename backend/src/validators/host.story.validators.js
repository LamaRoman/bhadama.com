// ==========================================
// HOST STORY VALIDATION SCHEMAS (Zod)
// ==========================================
// File: validators/host.story.validators.js
//
// Replaces the old story.validators.js
// Updated for HostStory model (story about the host, not listing)
// ==========================================

import { z } from "zod";

// ==========================================
// HELPER SCHEMAS
// ==========================================

// URL validation (optional, allows empty string)
const optionalUrlSchema = z
  .string()
  .url("Invalid URL format")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val));

// Social media URL patterns
const facebookUrlSchema = z
  .string()
  .regex(/^https?:\/\/(www\.)?facebook\.com\//, "Must be a valid Facebook URL")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val));

const instagramUrlSchema = z
  .string()
  .regex(/^https?:\/\/(www\.)?instagram\.com\//, "Must be a valid Instagram URL")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val));

const tiktokUrlSchema = z
  .string()
  .regex(/^https?:\/\/(www\.)?tiktok\.com\//, "Must be a valid TikTok URL")
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val));

// Video URL (YouTube or Vimeo)
const videoUrlSchema = z
  .string()
  .regex(
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//,
    "Must be a valid YouTube or Vimeo URL"
  )
  .optional()
  .or(z.literal(""))
  .transform((val) => (val === "" ? null : val));

// ==========================================
// CREATE HOST STORY SCHEMA
// ==========================================

export const createHostStorySchema = z.object({
  // Basic Info
  hostingSince: z
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),

  tagline: z
    .string()
    .max(150, "Tagline must be less than 150 characters")
    .optional(),

  // Main Story (Required)
  storyTitle: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),

  storyContent: z
    .string()
    .min(200, "Story must be at least 200 characters")
    .max(10000, "Story must be less than 10,000 characters"),

  // What makes them a great host
  highlights: z
    .array(
      z
        .string()
        .min(3, "Highlight must be at least 3 characters")
        .max(200, "Highlight must be less than 200 characters")
    )
    .max(10, "Maximum 10 highlights allowed")
    .optional()
    .default([]),

  specialties: z
    .array(
      z
        .string()
        .min(3, "Specialty must be at least 3 characters")
        .max(200, "Specialty must be less than 200 characters")
    )
    .max(10, "Maximum 10 specialties allowed")
    .optional()
    .default([]),

  // Personal touch
  funFacts: z
    .array(
      z
        .string()
        .min(3, "Fun fact must be at least 3 characters")
        .max(300, "Fun fact must be less than 300 characters")
    )
    .max(10, "Maximum 10 fun facts allowed")
    .optional()
    .default([]),

  hostMessage: z
    .string()
    .max(1000, "Host message must be less than 1,000 characters")
    .optional(),

  // Media
  videoUrl: videoUrlSchema,
  coverImage: optionalUrlSchema,

  // Social Links
  websiteUrl: optionalUrlSchema,
  facebookUrl: facebookUrlSchema,
  instagramUrl: instagramUrlSchema,
  tiktokUrl: tiktokUrlSchema,

  // Status (optional - defaults based on auto-publish setting)
  status: z.enum(["DRAFT", "PENDING"]).optional(),
});

// ==========================================
// UPDATE HOST STORY SCHEMA
// ==========================================

export const updateHostStorySchema = createHostStorySchema.partial();

// ==========================================
// REJECTION SCHEMA (Admin)
// ==========================================

export const rejectionSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a detailed rejection reason (min 10 characters)")
    .max(1000, "Rejection reason must be less than 1,000 characters"),
});

// ==========================================
// QUERY SCHEMAS (Admin)
// ==========================================

export const storyListQuerySchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "REJECTED"]).optional(),
  search: z.string().max(100).optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default("20"),
  sortBy: z
    .enum(["createdAt", "updatedAt", "publishedAt", "viewCount"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  createHostStorySchema,
  updateHostStorySchema,
  rejectionSchema,
  storyListQuerySchema,
};