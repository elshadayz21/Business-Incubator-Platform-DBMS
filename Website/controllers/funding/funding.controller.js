import {
  createFundingRequest,
  getAllFundingRequests,
  getFundingRequestById,
  updateFundingRequestStatus,
  deleteFundingRequest,
  getFundingDashboard,
  getFundingByStage,
  getUserProjects,
} from "../../models/funding/funding.model.js";

import { BadRequestError } from "../../utils/error.js";
import { getProjectEntrepreneurs, getProjectById } from "../../models/project/project.model.js";
import { createNotification } from "../../models/auth/auth.model.js";
import eventBus from "../../utils/eventBus.js";

// Create a new funding request
export const createFundingRequestController = async (req, res, next) => {
  try {
    const { project_id, investor_id, amount, funding_stage, description } =
      req.body;

    // Validation
    if (!project_id || !amount) {
      throw new BadRequestError("Project ID and Amount are required", 400);
    }

    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestError("Amount must be a positive number", 400);
    }

    if (!funding_stage) {
      throw new BadRequestError("Funding stage is required", 400);
    }

    const fundingRequest = await createFundingRequest({
      project_id: parseInt(project_id),
      investor_id: investor_id ? parseInt(investor_id) : null,
      amount: parseFloat(amount),
      funding_stage,
      description: description || null,
    });

    // Emit event for subscribers
    eventBus.emit("funding.requested", { request: fundingRequest, userId: req.session.userId });

    res.status(201).json({
      success: true,
      message: "Funding request created successfully",
      data: fundingRequest,
    });
  } catch (error) {
    console.error("Error in createFundingRequestController:", error);
    next(error);
  }
};

// Get all funding requests with filters
export const getAllFundingRequestsController = async (req, res, next) => {
  try {
    const { status, funding_stage, project_id } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (funding_stage) filters.funding_stage = funding_stage;
    if (project_id) filters.project_id = parseInt(project_id);

    const fundingRequests = await getAllFundingRequests(filters);

    res.status(200).json({
      success: true,
      message: "Funding requests retrieved successfully",
      data: fundingRequests,
      count: fundingRequests.length,
    });
  } catch (error) {
    console.error("Error in getAllFundingRequestsController:", error);
    next(error);
  }
};

// Get single funding request by ID
export const getFundingRequestByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new BadRequestError("Invalid funding request ID", 400);
    }

    const fundingRequest = await getFundingRequestById(parseInt(id));

    if (!fundingRequest) {
      throw new BadRequestError("Funding request not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Funding request retrieved successfully",
      data: fundingRequest,
    });
  } catch (error) {
    console.error("Error in getFundingRequestByIdController:", error);
    next(error);
  }
};

// Update funding request status (for admin review)
export const updateFundingRequestStatusController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id || isNaN(id)) {
      throw new BadRequestError("Invalid funding request ID", 400);
    }

    if (!status) {
      throw new BadRequestError("Status is required", 400);
    }

    const validStatuses = ["Pending", "Approved", "Rejected", "Under Review"];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        400,
      );
    }

    // Get user ID from session (assuming reviewed by admin)
    const reviewedBy = req.session?.userId || null;
    const isInvestor = req.session?.userRole === "investor";

    const updatedRequest = await updateFundingRequestStatus(
      parseInt(id),
      status,
      reviewedBy,
      notes || null,
      isInvestor,
    );

    if (!updatedRequest) {
      throw new BadRequestError("Funding request not found", 404);
    }

    // Emit event for subscribers (logging, metrics, decoupled notifications)
    eventBus.emit("funding.reviewed", {
      request: updatedRequest,
      reviewer: { id: reviewedBy, name: req.session.userName || "investor" }
    });

    res.status(200).json({
      success: true,
      message: "Funding request status updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error in updateFundingRequestStatusController:", error);
    next(error);
  }
};

// Delete funding request
export const deleteFundingRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throw new BadRequestError("Invalid funding request ID", 400);
    }

    const deletedRequest = await deleteFundingRequest(parseInt(id));

    if (!deletedRequest) {
      throw new BadRequestError("Funding request not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Funding request deleted successfully",
      data: deletedRequest,
    });
  } catch (error) {
    console.error("Error in deleteFundingRequestController:", error);
    next(error);
  }
};

// Get funding dashboard (status per project/stage)
export const getFundingDashboardController = async (req, res, next) => {
  try {
    const dashboard = await getFundingDashboard();

    res.status(200).json({
      success: true,
      message: "Funding dashboard retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error("Error in getFundingDashboardController:", error);
    next(error);
  }
};

// Get funding status by stage
export const getFundingByStageController = async (req, res, next) => {
  try {
    const fundingByStage = await getFundingByStage();

    // Transform data for better visualization
    const grouped = {};
    fundingByStage.forEach((item) => {
      if (!grouped[item.stage]) {
        grouped[item.stage] = {
          stage: item.stage,
          statuses: {},
          total_count: 0,
          total_amount: 0,
        };
      }
      grouped[item.stage].statuses[item.status.toLowerCase()] = {
        count: item.count,
        amount: item.total_amount,
        avgAmount: item.avg_amount,
      };
      grouped[item.stage].total_count += item.count;
      grouped[item.stage].total_amount =
        (grouped[item.stage].total_amount || 0) + (item.total_amount || 0);
    });

    res.status(200).json({
      success: true,
      message: "Funding by stage retrieved successfully",
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error("Error in getFundingByStageController:", error);
    next(error);
  }
};

// Show funding request form page
export const newFundingRequestPage = async (req, res, next) => {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      req.flash("error", "Please log in to request funding");
      return res.redirect("/v1/auth/login");
    }

    const userProjects = await getUserProjects(userId);

    res.render("funding/request-funding", {
      projects: userProjects,
      error: req.flash("error")[0],
      success: req.flash("success")[0],
    });
  } catch (error) {
    console.error("Error in newFundingRequestPage:", error);
    next(error);
  }
};

// Create funding request from form submission
export const createFundingRequestFormController = async (req, res, next) => {
  try {
    const { project_id, amount, funding_stage, description } = req.body;
    const userId = req.session?.userId;

    // Validation
    if (!project_id || !amount || !funding_stage) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/v1/funding/new");
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      req.flash("error", "Amount must be a positive number");
      return res.redirect("/v1/funding/new");
    }

    const fundingRequest = await createFundingRequest({
      project_id: parseInt(project_id),
      investor_id: null,
      amount: parseFloat(amount),
      funding_stage,
      description: description || null,
    });

    req.flash(
      "success",
      `Funding request of $${parseFloat(amount).toLocaleString()} created successfully! Our team will review it shortly.`,
    );
    res.redirect("/v1/projects");
  } catch (error) {
    console.error("Error in createFundingRequestFormController:", error);
    req.flash("error", "An error occurred while creating your funding request");
    res.redirect("/v1/funding/new");
  }
};
