import { Router } from "express";
import { clearAccessToken, issueAccessToken } from "../controllers/securityController.js";
import { requireBetterAuthSession } from "../middleware/authSession.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.post("/token", requireBetterAuthSession, asyncHandler(issueAccessToken));
router.post("/logout", clearAccessToken);
export default router;
