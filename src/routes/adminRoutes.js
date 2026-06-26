import { Router } from "express";
import {
  getAdminOverview,
  getStartupsForAdmin,
  getTransactions,
  getUsers,
  setStartupStatus,
  setUserBlocked
} from "../controllers/adminController.js";
import { allowRoles, requireJwt } from "../middleware/jwtAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireJwt, allowRoles("admin"));
router.get("/overview", asyncHandler(getAdminOverview));
router.get("/users", asyncHandler(getUsers));
router.patch("/users/:id/block", asyncHandler(setUserBlocked));
router.get("/startups", asyncHandler(getStartupsForAdmin));
router.patch("/startups/:id/status", asyncHandler(setStartupStatus));
router.get("/transactions", asyncHandler(getTransactions));
export default router;
