import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const generateUniqueFilename = (originalName) => {
  const extension = originalName.split(".").pop();
  const uniqueId = crypto.randomUUID();
  const timestamp = Date.now();
  return `${timestamp}-${uniqueId}.${extension}`;
};

/**
 * Upload file to S3
 * @param {Object} file - File object with buffer, originalname, mimetype
 * @param {String} key - S3 key/path (if not provided, will use listingId pattern)
 * @param {Number} listingId - Optional listing ID for backward compatibility
 */
export const uploadToS3 = async (file, key, listingId = null) => {
  try {
    // If key is a number, it's the old listingId parameter - handle backward compatibility
    if (typeof key === 'number') {
      listingId = key;
      key = `listings/${listingId}/${generateUniqueFilename(file.originalname)}`;
    }
    
    // If no key provided but listingId is, generate listing key
    if (!key && listingId) {
      key = `listings/${listingId}/${generateUniqueFilename(file.originalname)}`;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const secure_url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { secure_url, key };
  } catch (err) {
    console.error("S3 upload error:", err);
    throw new Error(`Failed to upload image: ${err.message}`);
  }
};

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