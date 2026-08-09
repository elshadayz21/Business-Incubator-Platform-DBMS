import ExcelJS from "exceljs";
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


//for announcement
// Announcements (CMS)
router.get(
    "/announcements",
    asyncHandler(async (req, res) => res.json(await getAllAnnouncements())),
);
router.post(
    "/announcements",
    asyncHandler(async (req, res) => res.json(await createAnnouncement(req.body))),
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
    asyncHandler(async (req, res) => res.json(await getSuggestedMentors(req.params.id)))
);
router.post(
    "/projects/:id/assign-mentor",
    asyncHandler(async (req, res) => res.json(await assignMentor(req.params.id, req.body.mentorId)))
);

// Safe Multi-Tab Excel Export Route
router.get(
    "/reports/export/dashboard",
    asyncHandler(async (req, res) => {
      try {
        // 1. Fetch data
        const projects = await getAllProjects();
        const mentors = await getAllMentors();
        const workshops = await getAllWorkshops();

        // Fetch funding and inbox safely
        const fundingRaw = await getAllFundingRequests("");
        const funding = Array.isArray(fundingRaw) ? fundingRaw : (fundingRaw?.data || []);

        const inboxRaw = await getAllSubmissions();
        const inbox = Array.isArray(inboxRaw) ? inboxRaw : [];

        // 2. Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();

        // Helper function to build sheets safely
        const buildSheet = (sheetName, data, columns) => {
          const ws = workbook.addWorksheet(sheetName);
          ws.columns = columns;
          ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00ADEF" } };
          ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

          if (Array.isArray(data)) {
            data.forEach((row) => ws.addRow(row));
          }
        };

        // 3. Build Tabs
        buildSheet("Projects", projects, [
          { header: "ID", key: "id", width: 5 },
          { header: "Name", key: "name", width: 30 },
          { header: "Domain", key: "domain", width: 20 },
          { header: "Stage", key: "stage", width: 15 },
        ]);

        buildSheet("Mentors", mentors, [
          { header: "ID", key: "id", width: 5 },
          { header: "Name", key: "name", width: 30 },
          { header: "Expertise", key: "expertise", width: 25 },
          { header: "Email", key: "email", width: 30 },
        ]);
        buildSheet("Workshops", workshops, [
          { header: "ID", key: "id", width: 5 },
          { header: "Title", key: "title", width: 30 },
          { header: "Category", key: "category", width: 20 },
          { header: "Schedule", key: "schedule", width: 25 },
          { header: "Capacity", key: "capacity", width: 10 },
        ]);

        buildSheet("Funding", funding, [
          { header: "ID", key: "id", width: 5 },
          { header: "Project ID", key: "project_id", width: 10 },
          { header: "Amount", key: "amount", width: 15 },
          { header: "Status", key: "status", width: 15 },
        ]);

        buildSheet("Inbox Messages", inbox, [
          { header: "ID", key: "id", width: 5 },
          { header: "Type", key: "type", width: 15 },
          { header: "Name", key: "name", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Message", key: "message", width: 50 },
        ]);

        // 4. Send the file
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=dxvalley_dashboard_report.xlsx");
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        res.status(500).json({ message: "Failed to generate Excel file." });
      }
    })
);

export default router;

