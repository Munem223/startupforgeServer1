import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { success } from "../utils/response.js";

export async function uploadToImageBB(req, res) {
  if (!env.IMGBB_API_KEY) throw new HttpError(503, "ImageBB is not configured");
  if (!req.file) throw new HttpError(400, "Please select an image file");

  const form = new FormData();
  const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
  form.append("image", blob, req.file.originalname);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`,
    { method: "POST", body: form }
  );
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new HttpError(502, result?.error?.message || "Image upload failed");
  }

  return success(
    res,
    {
      url: result.data.display_url,
      deleteUrl: result.data.delete_url
    },
    "Image uploaded successfully",
    201
  );
}
