import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

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
 * Upload file to Cloudinary
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

    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: publicId,
      resource_type: 'auto',
      folder: folder,
    });

    return {
      secure_url: result.secure_url,
      key: result.public_id, // Cloudinary uses public_id instead of key
      public_id: result.public_id,
    };
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