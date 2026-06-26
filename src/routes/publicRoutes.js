import { Router } from "express";
import {
  browseOpportunities,
  browseStartups,
  getFeaturedOpportunities,
  getFeaturedStartups,
  getOpportunityDetails,
  getPublicStatistics,
  getStartupDetails
} from "../controllers/publicController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/stats", asyncHandler(getPublicStatistics));
router.get("/startups/featured", asyncHandler(getFeaturedStartups));
router.get("/startups", asyncHandler(browseStartups));
router.get("/startups/:id", asyncHandler(getStartupDetails));
router.get("/opportunities/featured", asyncHandler(getFeaturedOpportunities));
router.get("/opportunities", asyncHandler(browseOpportunities));
router.get("/opportunities/:id", asyncHandler(getOpportunityDetails));

export default router;
