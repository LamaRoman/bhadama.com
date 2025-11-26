import AWS from "aws-sdk";

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,  // AWS access key
    secretAccessKey: process.env.AWS_SECRET_KEY, // AWS secret KEY
    region:process.env.AWS_REGION // YOUR BUCKET REGION
})

/**
 * Upload a base64 image to S3
 * @param {string} base64Image-base64 encoded image string
 * @returns {string} - URL of upload image
 */

export const uploadToS3 = async (base64Image) =>{
    try{
        // Remove prefix if exists
        const base64Data = Buffer.from(
            base64Image.replace(/^data:image\/\w+;base64,/,""),
            "base64"
        );
        //Generate unique file name
        const key = `listings/${Date.now()}-${Math.random().toString(36).substring(2,3)}.jpg`;
    

    // Upload parameters
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key : key,
        Body: base64Data,
        ACL : "public-read", // So images are accessible
        ContentEncoding: "base64",
        ContentType: "image/jpeg",
    }

    const data = await s3.upload(params).promise();
    return data.Location; // URL of uploaded image

} catch(err){
    console.error("S3 upload error",err);
    throw new Error("Failed to upload image");
}
};