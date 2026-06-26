import { Router } from "express";
import {
  applyToOpportunity,
  getCollaboratorOverview,
  getMyApplications
} from "../controllers/collaboratorController.js";
import { allowRoles, requireJwt } from "../middleware/jwtAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireJwt, allowRoles("collaborator"));
router.get("/overview", asyncHandler(getCollaboratorOverview));
router.get("/applications", asyncHandler(getMyApplications));
router.post("/opportunities/:opportunityId/apply", asyncHandler(applyToOpportunity));
export default router;
