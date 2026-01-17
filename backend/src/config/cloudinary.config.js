import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateUniqueFilename = (originalName) => {
  const extension = originalName.split(".").pop();
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}`;
};

/**
 * Upload file to Cloudinary using stream (no base64 conversion)
 * @param {Object} file - File object with buffer, originalname, mimetype
 * @param {String} folder - Cloudinary folder path (e.g., 'listings/123')
 * @param {Number} listingId - Optional listing ID for folder structure
 */
export const uploadToCloudinary = async (file, folder = null, listingId = null) => {
  try {
    // Handle backward compatibility
    if (typeof folder === 'number') {
      listingId = folder;
      folder = `listings/${listingId}`;
    }
    
    // If no folder provided but listingId is, generate folder path
    if (!folder && listingId) {
      folder = `listings/${listingId}`;
    }
    
    // Default folder if none provided
    if (!folder) {
      folder = 'uploads';
    }

    const publicId = `${folder}/${generateUniqueFilename(file.originalname)}`;

    // Use upload_stream instead of base64
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'auto',
          folder: folder,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else {
            resolve({
              secure_url: result.secure_url,
              key: result.public_id,
              public_id: result.public_id,
            });
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw new Error(`Failed to upload image: ${err.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - The public_id of the image to delete
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      return true;
    } else {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    throw new Error(`Failed to delete image: ${err.message}`);
  }
};

export { cloudinary };