import { Router } from "express";
import {
  createFundingRequestController,
  getAllFundingRequestsController,
  getFundingRequestByIdController,
  updateFundingRequestStatusController,
  deleteFundingRequestController,
  getFundingDashboardController,
  getFundingByStageController,
  newFundingRequestPage,
  createFundingRequestFormController,
} from "../../controllers/funding/funding.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js";
import { authorizeRole } from "../../middleware/check_roles.middleware.js";

const router = Router();

// Web form endpoints

// Show funding request form page
router.get(
  "/new",
  isAuth,
  authorizeRole("entrepreneur", "mentor"),
  newFundingRequestPage,
);

// Create funding request from form
router.post(
  "/create",
  isAuth,
  authorizeRole("entrepreneur", "mentor"),
  createFundingRequestFormController,
);

// API endpoints (JSON)

// Create funding request - entrepreneurs/mentors can request funding
router.post(
  "/",
  isAuth,
  authorizeRole("entrepreneur", "mentor"),
  createFundingRequestController,
);


// Admin-only endpoints

// Get funding dashboard - shows status per project
router.get(
  "/dashboard/summary",
  isAuth,
  authorizeRole("admin"),
  getFundingDashboardController,
);

// Update funding request status - only admins and investors can review
router.put(
  "/:id/status",
  isAuth,
  authorizeRole("admin", "investor"),
  updateFundingRequestStatusController,
);

// Delete funding request - only admins
router.delete(
  "/:id",
  isAuth,
  authorizeRole("admin"),
  deleteFundingRequestController,
);

export default router;
