import { Router } from "express";
import {
  createOpportunity,
  createStartup,
  deleteOpportunity,
  deleteStartup,
  getFounderApplications,
  getFounderOverview,
  getMyOpportunities,
  getMyStartup,
  updateApplicationStatus,
  updateOpportunity,
  updateStartup
} from "../controllers/founderController.js";
import { allowRoles, requireJwt } from "../middleware/jwtAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireJwt, allowRoles("founder"));

router.get("/overview", asyncHandler(getFounderOverview));
router.get("/startup", asyncHandler(getMyStartup));
router.post("/startup", asyncHandler(createStartup));
router.patch("/startup/:id", asyncHandler(updateStartup));
router.delete("/startup/:id", asyncHandler(deleteStartup));

router.get("/opportunities", asyncHandler(getMyOpportunities));
router.post("/opportunities", asyncHandler(createOpportunity));
router.patch("/opportunities/:id", asyncHandler(updateOpportunity));
router.delete("/opportunities/:id", asyncHandler(deleteOpportunity));

router.get("/applications", asyncHandler(getFounderApplications));
router.patch("/applications/:id/status", asyncHandler(updateApplicationStatus));

export default router;
