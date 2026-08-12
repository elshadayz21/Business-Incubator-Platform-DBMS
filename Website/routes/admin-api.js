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
  updateResource,
  deleteResource,
  getPendingBookings,
  updateBookingStatus,
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
  getSuggestedMentors,
  assignMentor,
} from "../admin-backend/projects/projects.js";
// for admin inbox
import {
  getAllSubmissions,
  deleteSubmission,
} from "../admin-backend/inbox/inbox.js";
//.............
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
//for Announcements
import {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../admin-backend/announcements/announcements.js";
import {
  getAllStaticPages,
  getStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
} from "../admin-backend/content/staticPages.js";
import {
  getAllCohorts,
  getCohortById,
  createCohort,
  updateCohort,
  deleteCohort,
} from "../admin-backend/cohorts/cohorts.js";
import {
  getCohortMembers,
  addCohortMember,
  removeCohortMember,
  getMentorAssignments,
  createMentorAssignment,
  deleteMentorAssignment,
  getSessionsForAssignment,
  createMentorSession,
  getUsersByRole,
} from "../admin-backend/mentorship/mentorship.js";
import {
  getReportSummary,
  getReportRows,
} from "../admin-backend/reports/reports.js";
import ExcelJS from "exceljs";
import { authorizeRole } from "../middleware/check_roles.middleware.js";
import { ROLES } from "../utils/constants.js";

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

router.use(authorizeRole(ROLES.SUPERADMIN, ROLES.ADMIN));

router.get(
  "/reports/summary",
  asyncHandler(async (req, res) => res.json(await getReportSummary())),
);

router.get(
  "/reports/export",
  asyncHandler(async (req, res) => {
    const rows = await getReportRows();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cohort Report");

    sheet.columns = [
      { header: "Cohort", key: "cohort", width: 20 },
      { header: "Type", key: "type", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Name", key: "full_name", width: 24 },
      { header: "Email", key: "email", width: 28 },
      { header: "Stage", key: "current_stage", width: 14 },
      { header: "Joined", key: "joined_at", width: 16 },
    ];
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=dxvalley-cohort-report.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
  }),
);
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
router.put(
  "/resources/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateResource(req.params.id, req.body.data)),
  ),
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

// Inbox (Contact & Newsletter)
router.get(
  "/inbox",
  asyncHandler(async (req, res) => res.json(await getAllSubmissions())),
);
router.delete(
  "/inbox/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteSubmission(req.params.id)),
  ),
);

// Announcements (CMS)
router.get(
  "/announcements",
  asyncHandler(async (req, res) => res.json(await getAllAnnouncements())),
);
router.post(
  "/announcements",
  asyncHandler(async (req, res) =>
    res.json(await createAnnouncement(req.body)),
  ),
);
router.delete(
  "/announcements/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteAnnouncement(req.params.id)),
  ),
);

// AI Mentor Matching Routes
router.get(
  "/projects/:id/suggested-mentors",
  asyncHandler(async (req, res) =>
    res.json(await getSuggestedMentors(req.params.id)),
  ),
);
router.post(
  "/projects/:id/assign-mentor",
  asyncHandler(async (req, res) =>
    res.json(await assignMentor(req.params.id, req.body.mentorId)),
  ),
);

router.get(
  "/static-pages",
  asyncHandler(async (req, res) => res.json(await getAllStaticPages())),
);
router.get(
  "/static-pages/:id",
  asyncHandler(async (req, res) =>
    res.json(await getStaticPageById(req.params.id)),
  ),
);
router.post(
  "/static-pages",
  asyncHandler(async (req, res) => res.json(await createStaticPage(req.body))),
);
router.put(
  "/static-pages/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateStaticPage(req.params.id, req.body)),
  ),
);
router.delete(
  "/static-pages/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteStaticPage(req.params.id)),
  ),
);

router.get(
  "/cohorts",
  asyncHandler(async (req, res) => res.json(await getAllCohorts())),
);
router.get(
  "/cohorts/:id",
  asyncHandler(async (req, res) =>
    res.json(await getCohortById(req.params.id)),
  ),
);
router.post(
  "/cohorts",
  asyncHandler(async (req, res) => res.json(await createCohort(req.body))),
);
router.put(
  "/cohorts/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateCohort(req.params.id, req.body)),
  ),
);
router.delete(
  "/cohorts/:id",
  asyncHandler(async (req, res) => res.json(await deleteCohort(req.params.id))),
);
router.get(
  "/cohorts/:cohortId/members",
  asyncHandler(async (req, res) =>
    res.json(await getCohortMembers(req.params.cohortId)),
  ),
);
router.post(
  "/cohort-members",
  asyncHandler(async (req, res) => res.json(await addCohortMember(req.body))),
);
router.delete(
  "/cohort-members/:id",
  asyncHandler(async (req, res) =>
    res.json(await removeCohortMember(req.params.id)),
  ),
);

router.get(
  "/cohorts/:cohortId/mentor-assignments",
  asyncHandler(async (req, res) =>
    res.json(await getMentorAssignments(req.params.cohortId)),
  ),
);
router.post(
  "/mentor-assignments",
  asyncHandler(async (req, res) =>
    res.json(await createMentorAssignment(req.body)),
  ),
);
router.delete(
  "/mentor-assignments/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteMentorAssignment(req.params.id)),
  ),
);

router.get(
  "/mentor-assignments/:assignmentId/sessions",
  asyncHandler(async (req, res) =>
    res.json(await getSessionsForAssignment(req.params.assignmentId)),
  ),
);
router.post(
  "/mentor-sessions",
  asyncHandler(async (req, res) =>
    res.json(await createMentorSession(req.body)),
  ),
);

router.get(
  "/users-by-role/:role",
  asyncHandler(async (req, res) =>
    res.json(await getUsersByRole(req.params.role)),
  ),
);

export default router;
