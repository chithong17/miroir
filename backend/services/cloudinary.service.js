import { v2 as cloudinary } from "cloudinary";

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadImageBuffer = (buffer, originalFilename = "upload") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "miroir",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override: originalFilename.replace(/\.[^.]+$/, ""),
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error("Failed to upload image to Cloudinary."));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
