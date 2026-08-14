import multer from "multer";
import path from "path";


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Files will be saved here
  },
  filename: (req, file, cb) => {
    cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Security: Only allow PDFs and Images
    const filetypes = /pdf|doc|docx|png|jpg|jpeg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Error: Invalid file type!"));
  }
});


import { getFormFields, saveFormFields } from "../admin-backend/applications/applications.js";

import {
  getAllApplications,
  updateApplicationStatus,
  sendMassInvites
} from "../admin-backend/applications/applications.js";


import { Router } from "express";
import pool from "../config/db.js";
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

// Create Announcement with File Upload
router.post(
    "/announcements",
    upload.single("document"),
    asyncHandler(async (req, res) => {
      // 1. Destructure ALL fields from req.body!
      const { title, content, deadline, is_open_call, capacity } = req.body;

      let document_url = null;
      if (req.file) {
        document_url = `/uploads/${req.file.filename}`;
      }

      // 2. Parse the checkbox and capacity values
      const parsedIsOpenCall = is_open_call === "true" || is_open_call === true;
      const parsedCapacity = capacity ? parseInt(capacity, 10) : null;

      // 3. Pass them to the database function!
      const newAnnouncement = await createAnnouncement({
        title,
        content,
        deadline,
        document_url,
        is_open_call: parsedIsOpenCall,
        capacity: parsedCapacity
      });

      res.json(newAnnouncement);
    })
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

// Multi-Tab Excel Export Route
router.get(
    "/reports/export",
    asyncHandler(async (req, res) => {
      try {
        // 1. Fetch data safely using functions we know work!
        const projects = await getAllProjects();
        const mentors = await getAllMentors();
        const workshops = await getAllWorkshops();

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

// Reports Summary
router.get("/reports/summary", async (req, res) => {
  try {
    // 1. Fetch data
    const projects = await getAllProjects();
    const mentors = await getAllMentors();

    const totalProjects = projects.length;
    const totalMentors = mentors.length;

    // 2. Group projects by stage for the Pie Chart
    const statusBreakdown = projects.reduce((acc, p) => {
      const stage = p.stage || "Unknown";
      const found = acc.find(item => item.name === stage);
      if (found) found.value++;
      else acc.push({ name: stage, value: 1 });
      return acc;
    }, []);

    // 3. Mock data for cohorts
    const applicantsByCohort = [
      { cohort_id: 1, count: totalProjects > 0 ? Math.floor(totalProjects / 2) : 5 },
      { cohort_id: 2, count: totalProjects > 0 ? Math.ceil(totalProjects / 2) : 8 }
    ];
    const cohorts = [
      { id: 1, name: "Batch 01" },
      { id: 2, name: "Batch 02" }
    ];
    const mentorLoad = mentors.map((m, i) => ({ mentor_id: m.id, load: Math.floor(Math.random() * 5) }));

    // 4. Send the response
    res.json({
      totalProjects,
      totalMentors,
      applicantsByCohort,
      statusBreakdown,
      cohorts,
      mentorLoad
    });
  } catch (error) {
    // THIS WILL NOW PRINT THE EXACT ERROR IN YOUR TERMINAL!
    console.error("🔥 SUMMARY ROUTE ERROR:", error);
    res.status(500).json({ message: "Failed to load report summary." });
  }
});

// Applications (Open Call Submissions)
router.get(
    "/applications",
    asyncHandler(async (req, res) => res.json(await getAllApplications()))
);

router.put(
    "/applications/:id/status",
    asyncHandler(async (req, res) =>
        res.json(await updateApplicationStatus(req.params.id, req.body.status))
    )
);


// Form Builder Routes
router.get(
    "/announcements/:id/form-fields",
    asyncHandler(async (req, res) => res.json(await getFormFields(req.params.id)))
);

router.post(
    "/announcements/:id/form-fields",
    asyncHandler(async (req, res) => res.json(await saveFormFields(req.params.id, req.body.fields)))
);
// Mass Email Route
router.post(
    "/applications/send-invites",
    asyncHandler(async (req, res) => res.json(await sendMassInvites()))
);

export default router;



