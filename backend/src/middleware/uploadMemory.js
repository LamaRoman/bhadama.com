import multer from "multer";

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// File size limit (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of files per upload
const MAX_FILES = 10;

/**
 * File filter to validate uploaded files
 */
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
      ),
      false
    );
  }
};

/**
 * Multer configuration using memory storage
 * Files are stored in memory as Buffer objects for direct S3 upload
 */
export const  upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: fileFilter,
});

/**
 * Error handler middleware for Multer errors
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          error: `Too many files. Maximum is ${MAX_FILES} files`,
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected field name for file upload",
        });
      default:
        return res.status(400).json({
          error: `Upload error: ${err.message}`,
        });
    }
  } else if (err) {
    // Custom errors from fileFilter
    return res.status(400).json({
      error: err.message,
    });
  }
  next();
};

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES };