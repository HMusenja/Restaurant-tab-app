import { fetchUploadSignature } from "@/api/uploadsApi";

export async function uploadToCloudinary(file, { folder } = {}) {
  if (!file) throw new Error("No file selected");

  const sig = await fetchUploadSignature(folder);
  const { signature, timestamp, cloudName, apiKey } = sig;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  if (sig.folder) form.append("folder", sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  // data.secure_url is what you store in Mongo
  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
