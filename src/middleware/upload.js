import multer from "multer";
import { HttpError } from "../utils/httpError.js";

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new HttpError(400, "Only image files are allowed"));
    }
    callback(null, true);
  }
});
