import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// Initialize S3 Client (AWS SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * Generate a unique filename with original extension
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const extension = originalName.split(".").pop();
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${extension}`;
};

/**
 * Upload a file buffer to S3
 * @param {Object} file - Multer file object
 * @param {number} listingId - Listing ID for organizing files
 * @returns {Object} - { secure_url: string, key: string }
 */
export const uploadToS3 = async (file, listingId) => {
  try {
    const key = `listings/${listingId}/${generateUniqueFilename(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // Note: ACL requires bucket policy to allow public access
      // Consider using CloudFront or presigned URLs for better security
    });

    await s3Client.send(command);

    // Construct the public URL
    const secure_url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { secure_url, key };
  } catch (err) {
    console.error("S3 upload error:", err);
    throw new Error(`Failed to upload image: ${err.message}`);
  }
};

/**
 * Upload a base64 image to S3
 * @param {string} base64Image - Base64 encoded image string
 * @param {number} listingId - Listing ID for organizing files
 * @returns {Object} - { secure_url: string, key: string }
 */
export const uploadBase64ToS3 = async (base64Image, listingId) => {
  try {
    // Extract mime type and base64 data
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);

    let mimeType = "image/jpeg";
    let base64Data = base64Image;

    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const buffer = Buffer.from(base64Data, "base64");
    const extension = mimeType.split("/")[1] || "jpg";
    const key = `listings/${listingId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    const secure_url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { secure_url, key };
  } catch (err) {
    console.error("S3 base64 upload error:", err);
    throw new Error(`Failed to upload image: ${err.message}`);
  }
};

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {boolean} - Success status
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error("S3 delete error:", err);
    throw new Error(`Failed to delete image: ${err.message}`);
  }
};

export { s3Client };