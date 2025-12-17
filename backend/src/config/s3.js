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

export const uploadToS3 = async (file, listingId) => {
  try {
    const key = `listings/${listingId}/${generateUniqueFilename(file.originalname)}`;

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