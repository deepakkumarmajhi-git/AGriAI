import { v2 as cloudinary } from "cloudinary";

let isCloudinaryConfigured = false;

function configureCloudinary() {
  if (isCloudinaryConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary credentials in the server environment");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  isCloudinaryConfigured = true;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  opts?: { folder?: string; public_id?: string }
): Promise<{ secure_url: string; public_id: string }> {
  configureCloudinary();

  const folder = opts?.folder || process.env.CLOUDINARY_FOLDER || "smart-agri/scans";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: true,
        public_id: opts?.public_id,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
}
