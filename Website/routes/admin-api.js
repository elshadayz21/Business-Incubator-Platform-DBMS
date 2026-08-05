import { Router } from "express";
import {
  getAllWorkshops,
  getWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  trackAttendance,
  submitFeedback,
  getWorkshopEnrollments,
  getAttendanceReport,
  getFeedbackReport,
} from "../admin-backend/workshop/workshops.js";

import {
  getAllResources,
  addResource,
  getPendingBookings,
  updateBookingStatus,
  deleteResource,
  getResourceStats,
} from "../admin-backend/resources/resources.js";

import {
  getAllMentors,
  addMentor,
  deleteMentor,
  updateMentor,
} from "../admin-backend/mentors/mentors.js";

import {
  getAllProjects,
  getProjectById,
  updateProjectStatus,
  getProjectsByStatus,
  getProjectsStats,
  toggleProjectApproved,
} from "../admin-backend/projects/projects.js";

import {
  getAllFundingRequests,
  getFundingDashboard,
  getFundingByStage,
  getFundingRequestById,
  updateFundingRequestStatus,
  deleteFundingRequest,
} from "../admin-backend/funding/funding.js";
import loginRequest from "../admin-backend/auth/login.js";
import {
  getAllUsers,
  createAdminUser,
  updateUserRole,
  setUserStatus,
} from "../admin-backend/users/users.js";

const router = Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public Admin APIs
router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const result = await loginRequest(req.body);
    if (result.success) {
      req.session.userId = result.user.id;
      req.session.userRole = result.user.role;
      req.session.userName = result.user.name;
      req.session.userEmail = result.user.email;
    }
    res.json(result);
  }),
);

import { authorizeRole } from "../middleware/check_roles.middleware.js";
import { ROLES } from "../utils/constants.js";

router.use(authorizeRole(ROLES.SUPERADMIN, ROLES.ADMIN));

// Users (Superadmin only)
const superadminOnly = authorizeRole(ROLES.SUPERADMIN);
router.get(
  "/users",
  superadminOnly,
  asyncHandler(async (req, res) => res.json(await getAllUsers())),
);
router.post(
  "/users",
  superadminOnly,
  asyncHandler(async (req, res) => res.json(await createAdminUser(req.body))),
);
router.put(
  "/users/:id/role",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await updateUserRole(req.params.id, req.body.role)),
  ),
);
router.put(
  "/users/:id/status",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await setUserStatus(req.params.id, req.body.status)),
  ),
);  

// Workshops
router.get(
  "/workshops",
  asyncHandler(async (req, res) => res.json(await getAllWorkshops())),
);
router.get(
  "/workshops/:id",
  asyncHandler(async (req, res) => res.json(await getWorkshop(req.params.id))),
);
router.post(
  "/workshops",
  asyncHandler(async (req, res) => res.json(await createWorkshop(req.body))),
);
router.put(
  "/workshops/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateWorkshop(req.params.id, req.body)),
  ),
);
router.delete(
  "/workshops/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteWorkshop(req.params.id)),
  ),
);
router.post(
  "/workshops/attendance/:enrollmentId",
  asyncHandler(async (req, res) =>
    res.json(await trackAttendance(req.params.enrollmentId, req.body.attended)),
  ),
);
router.post(
  "/workshops/feedback/:enrollmentId",
  asyncHandler(async (req, res) =>
    res.json(await submitFeedback(req.params.enrollmentId, req.body)),
  ),
);
router.get(
  "/workshops/:id/enrollments",
  asyncHandler(async (req, res) =>
    res.json(await getWorkshopEnrollments(req.params.id)),
  ),
);

// Reports
router.get(
  "/reports/attendance",
  asyncHandler(async (req, res) => res.json(await getAttendanceReport())),
);
router.get(
  "/reports/feedback",
  asyncHandler(async (req, res) => res.json(await getFeedbackReport())),
);

// Resources & Bookings
router.get(
  "/resources",
  asyncHandler(async (req, res) => res.json(await getAllResources())),
);
router.post(
  "/resources",
  asyncHandler(async (req, res) => res.json(await addResource(req.body))),
);
router.delete(
  "/resources/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteResource(req.params.id)),
  ),
);
router.get(
  "/resources/stats",
  asyncHandler(async (req, res) => res.json(await getResourceStats())),
);
router.get(
  "/bookings/pending",
  asyncHandler(async (req, res) => res.json(await getPendingBookings())),
);
router.put(
  "/bookings/:id/status",
  asyncHandler(async (req, res) =>
    res.json(await updateBookingStatus(req.params.id, req.body.status)),
  ),
);

// Mentors
router.get(
  "/mentors",
  asyncHandler(async (req, res) => res.json(await getAllMentors())),
);
router.post(
  "/mentors",
  asyncHandler(async (req, res) => res.json(await addMentor(req.body))),
);
router.delete(
  "/mentors/:id",
  asyncHandler(async (req, res) => res.json(await deleteMentor(req.params.id))),
);
router.put(
  "/mentors/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateMentor(req.params.id, req.body.data)),
  ),
);

// Projects
router.get(
  "/projects",
  asyncHandler(async (req, res) => res.json(await getAllProjects())),
);
router.get(
  "/projects/stats",
  asyncHandler(async (req, res) => res.json(await getProjectsStats())),
);
router.get(
  "/projects/status/:status",
  asyncHandler(async (req, res) =>
    res.json(await getProjectsByStatus(req.params.status)),
  ),
);
router.get(
  "/projects/:id",
  asyncHandler(async (req, res) =>
    res.json(await getProjectById(req.params.id)),
  ),
);
router.put(
  "/projects/:id/status",
  asyncHandler(async (req, res) =>
    res.json(await updateProjectStatus(req.params.id, req.body.status)),
  ),
);
router.put(
  "/projects/:id/toggle-approved",
  asyncHandler(async (req, res) =>
    res.json(await toggleProjectApproved(req.params.id)),
  ),
);

// Funding
router.get(
  "/funding",
  asyncHandler(async (req, res) =>
    res.json(await getAllFundingRequests(req.query.query || "")),
  ),
);
router.get(
  "/funding/dashboard",
  asyncHandler(async (req, res) => res.json(await getFundingDashboard())),
);
router.get(
  "/funding/stage",
  asyncHandler(async (req, res) => res.json(await getFundingByStage())),
);
router.get(
  "/funding/:id",
  asyncHandler(async (req, res) =>
    res.json(await getFundingRequestById(req.params.id)),
  ),
);
router.put(
  "/funding/:id/status",
  asyncHandler(async (req, res) =>
    res.json(
      await updateFundingRequestStatus(
        req.params.id,
        req.body.status,
        req.body.notes,
      ),
    ),
  ),
);
router.delete(
  "/funding/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteFundingRequest(req.params.id)),
  ),
);

export default router;
