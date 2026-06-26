import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { uploadToImageBB } from "../controllers/uploadController.js";
import { uploadImage } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

router.post("/image", uploadLimiter, uploadImage.single("image"), asyncHandler(uploadToImageBB));
export default router;
