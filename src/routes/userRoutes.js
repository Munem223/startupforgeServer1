import { Router } from "express";
import {
  completeRegistration,
  getMyProfile,
  updateMyProfile
} from "../controllers/userController.js";
import { requireBetterAuthSession } from "../middleware/authSession.js";
import { requireJwt } from "../middleware/jwtAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/complete-registration", requireBetterAuthSession, asyncHandler(completeRegistration));
router.get("/me", requireJwt, asyncHandler(getMyProfile));
router.patch("/me", requireJwt, asyncHandler(updateMyProfile));
export default router;
