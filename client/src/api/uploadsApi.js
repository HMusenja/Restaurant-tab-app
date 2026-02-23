import { get } from "./client";

export const fetchUploadSignature = (folder = "restaurant-tab-app/menu") =>
  get(`/uploads/signature?folder=${encodeURIComponent(folder)}`);
