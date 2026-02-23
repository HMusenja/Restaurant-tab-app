import cloudinary from "../config/cloudinary.js";

export const getCloudinarySignature = async (req, res) => {
  // optional: enforce folder per resource type
  const folder = req.query.folder || "restaurant-tab-app/menu";

  const timestamp = Math.round(Date.now() / 1000);

  // Cloudinary signs uploads with timestamp + any upload params (folder, tags, etc.)
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
};
