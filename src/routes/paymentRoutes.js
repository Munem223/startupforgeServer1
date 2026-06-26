import { Router } from "express";
import {
  createCheckoutSession,
  verifyCheckoutSession
} from "../controllers/paymentController.js";
import { allowRoles, requireJwt } from "../middleware/jwtAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireJwt, allowRoles("founder"));
router.post("/checkout", asyncHandler(createCheckoutSession));
router.get("/verify", asyncHandler(verifyCheckoutSession));
export default router;
