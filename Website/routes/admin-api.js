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
    // Security: Only allow PDFs, Word docs and images.
    // Accept the file if the extension is allowed AND the mimetype is either a
    // matching office/image type or a generic application/octet-stream (some
    // browsers mislabel PDFs/DOCX as octet-stream, which must not be rejected).
    const allowedExt = /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(file.originalname);
    const allowedMime = /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|image\/(png|jpe?g))$/.test(file.mimetype);
    const genericMime = file.mimetype === "application/octet-stream";
    if (allowedExt && (allowedMime || genericMime)) return cb(null, true);
    cb(new Error("Error: Invalid file type. Only PDF, DOC, DOCX, PNG, JPG, and JPEG files are allowed."));
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
  resetUserPassword,
  deleteUser,
} from "../admin-backend/users/users.js";
//for Announcements
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  duplicateAnnouncement,
  getApplicationCount,
  deleteAnnouncement,
} from "../admin-backend/announcements/announcements.js";
//for Gallery CMS
import {
  getAllGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  setGalleryItemPublished,
  deleteGalleryItem,
  getGalleryCategories,
} from "../admin-backend/gallery/gallery.js";
import uploadGallery, {
  validateGalleryImage,
} from "../config/multer-gallery.js";
//for Mass Email (UR-B4)
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
import { getSystemOverview } from "../admin-backend/system/system.js";
import {
  getEmailSources,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailCampaigns,
  sendEmailCampaign,
} from "../admin-backend/emails/emails.js";
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

const adminOnly = authorizeRole(ROLES.ADMIN);
const superadminOnly = authorizeRole(ROLES.SUPERADMIN);

// Module access is strictly separated by role (no overlap):
//   Admin      -> operational modules (projects, mentors, workshops, resources,
//                 funding, inbox, announcements, cohorts, applications, ...)
//   Superadmin -> system/CMS modules (reports, users, gallery, static pages,
//                 system settings)
router.use("/reports", superadminOnly);
router.use("/workshops", adminOnly);
router.use("/resources", adminOnly);
router.use("/bookings", adminOnly);
router.use("/mentors", adminOnly);
router.use("/projects", adminOnly);
router.use("/funding", adminOnly);
router.use("/inbox", adminOnly);
router.use("/announcements", adminOnly);
router.use("/cohorts", adminOnly);
router.use("/cohort-members", adminOnly);
router.use("/mentor-assignments", adminOnly);
router.use("/mentor-sessions", adminOnly);
router.use("/users-by-role", adminOnly);
router.use("/applications", adminOnly);
router.use("/emails", adminOnly);

router.get(
  "/reports/summary",
  asyncHandler(async (req, res) => res.json(await getReportSummary())),
);
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
router.put(
  "/users/:id/password",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await resetUserPassword(req.params.id, req.body.password)),
  ),
);
router.delete(
  "/users/:id",
  superadminOnly,
  asyncHandler(async (req, res) => {
    if (Number(req.params.id) === Number(req.session.userId)) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }
    res.json(await deleteUser(req.params.id));
  }),
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

// Get Single Announcement
router.get(
  "/announcements/:id",
  asyncHandler(async (req, res) => {
    const ann = await getAnnouncementById(req.params.id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });
    res.json(ann);
  })
);

// Create Announcement with File Upload
router.post(
    "/announcements",
    upload.single("document"),
    asyncHandler(async (req, res) => {
      try {
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
          capacity: parsedCapacity,
          is_published: true
        });

        res.json(newAnnouncement);
      } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ message: error.message || "Failed to create announcement" });
      }
    })
);

// Update Announcement
router.put(
  "/announcements/:id",
  upload.single("document"),
  asyncHandler(async (req, res) => {
    const { title, content, deadline, is_open_call, capacity } = req.body;

    let document_url = req.body.document_url || null;
    if (req.file) {
      document_url = `/uploads/${req.file.filename}`;
    }

    const parsedIsOpenCall = is_open_call === "true" || is_open_call === true;
    const parsedCapacity = capacity ? parseInt(capacity, 10) : null;

    const updated = await updateAnnouncement(req.params.id, {
      title,
      content,
      deadline,
      document_url,
      is_open_call: parsedIsOpenCall,
      capacity: parsedCapacity
    });

    if (!updated) return res.status(404).json({ message: "Announcement not found" });
    res.json(updated);
  })
);

// Duplicate Announcement
router.post(
  "/announcements/:id/duplicate",
  asyncHandler(async (req, res) => {
    const duplicated = await duplicateAnnouncement(req.params.id);
    if (!duplicated) return res.status(404).json({ message: "Announcement not found" });
    res.json(duplicated);
  })
);

// Get Application Count for Announcement
router.get(
  "/announcements/:id/applications/count",
  asyncHandler(async (req, res) => {
    const count = await getApplicationCount(req.params.id);
    res.json({ count });
  })
);

router.delete(
  "/announcements/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteAnnouncement(req.params.id)),
  ),
);

// Convert announcement upload/validation errors into JSON 400 responses
// instead of letting them fall through to the HTML 500 error page.
router.use("/announcements", (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let message = err && err.message ? err.message : "Invalid request";
  if (err && err.name === "MulterError") {
    message = err.code === "LIMIT_FILE_SIZE"
      ? "Document exceeds the maximum file size."
      : err.message;
  }
  // The request body may not have been fully consumed after multer aborted
  // the parser. Drain it and refuse connection reuse so the keep-alive
  // socket is not corrupted for the next request.
  req.on("error", () => {});
  req.resume();
  res.setHeader("Connection", "close");
  return res.status(400).json({ message });
});

// Gallery (CMS) — Superadmin only
router.get(
    "/gallery",
    superadminOnly,
    asyncHandler(async (req, res) => {
        const { page, pageSize, q, category, status, sortBy, sortDir } = req.query;
        const opts = {
            q,
            category,
            status,
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
            sortBy,
            sortDir,
        };
        const result = await getAllGalleryItems(opts);
        res.json({ items: result.rows, total: result.total });
    }),
);

// Default categories fallback for admin UI when DB has none
const GALLERY_DEFAULT_CATEGORIES = [
  'Events',
  'Workshops',
  'Training',
  'Mentorship',
  'Demo Day',
  'Community',
  'Other',
];

// NOTE: this route MUST be registered before /gallery/:id so that the
// parameterized route does not shadow the categories endpoint.
router.get(
    "/gallery/categories",
    superadminOnly,
    asyncHandler(async (req, res) => {
        const cats = await getGalleryCategories();
        if (!cats || !Array.isArray(cats) || cats.length === 0) {
            return res.json({ categories: GALLERY_DEFAULT_CATEGORIES });
        }
        res.json({ categories: cats });
    }),
);

router.get(
    "/gallery/:id",
    superadminOnly,
    asyncHandler(async (req, res) =>
        res.json(await getGalleryItem(req.params.id)),
    ),
);

router.post(
    "/gallery",
    superadminOnly,
    uploadGallery.single("image"),
    validateGalleryImage,
    asyncHandler(async (req, res) => {
        const data = {
            ...req.body,
            imageUrl: req.file
                ? `/uploads/gallery/${req.file.filename}`
                : req.body.imageUrl,
        };
        res.json(await createGalleryItem(data));
    }),
);
router.put(
    "/gallery/:id",
    superadminOnly,
    uploadGallery.single("image"),
    validateGalleryImage,
    asyncHandler(async (req, res) => {
        const data = {
            ...req.body,
            imageUrl: req.file
                ? `/uploads/gallery/${req.file.filename}`
                : req.body.imageUrl,
        };
        res.json(await updateGalleryItem(req.params.id, data));
    }),
);
router.patch(
    "/gallery/:id/publish",
    superadminOnly,
    asyncHandler(async (req, res) =>
        res.json(
            await setGalleryItemPublished(
                req.params.id,
                req.body.isPublished,
            ),
        ),
    ),
);
router.delete(
    "/gallery/:id",
    superadminOnly,
    asyncHandler(async (req, res) =>
        res.json(await deleteGalleryItem(req.params.id)),
    ),
);

// Convert gallery upload/validation errors into JSON 400 responses instead of
// letting them fall through to the HTML 500 error page.
router.use("/gallery", (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isMulterError = err && err.name === "MulterError";
  if (isMulterError || (err && err.status === 400)) {
    let message = err.message || "Invalid request";
    if (isMulterError && err.code === "LIMIT_FILE_SIZE") {
      message = "Image exceeds maximum size of 5MB.";
    }
    // The request body may not have been fully consumed after multer aborted
    // the parser. Drain it and refuse connection reuse so the keep-alive
    // socket is not corrupted for the next request.
    req.on("error", () => {});
    req.resume();
    res.setHeader("Connection", "close");
    return res.status(400).json({ message });
  }

  return next(err);
});


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

// Static Pages (branding CMS) — Superadmin only
router.get(
  "/static-pages",
  superadminOnly,
  asyncHandler(async (req, res) => res.json(await getAllStaticPages())),
);
router.get(
  "/static-pages/:id",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await getStaticPageById(req.params.id)),
  ),
);
router.post(
  "/static-pages",
  superadminOnly,
  asyncHandler(async (req, res) => res.json(await createStaticPage(req.body))),
);
router.put(
  "/static-pages/:id",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await updateStaticPage(req.params.id, req.body)),
  ),
);
router.delete(
  "/static-pages/:id",
  superadminOnly,
  asyncHandler(async (req, res) =>
    res.json(await deleteStaticPage(req.params.id)),
  ),
);

// System Overview (Superadmin only)
router.get(
  "/system/overview",
  superadminOnly,
  asyncHandler(async (req, res) => res.json(await getSystemOverview())),
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
    asyncHandler(async (req, res) => {
      try {
        const fields = await getFormFields(req.params.id);
        res.json(fields);
      } catch (error) {
        console.error("Error fetching form fields:", error);
        res.status(500).json({ message: error.message });
      }
    })
);

router.post(
    "/announcements/:id/form-fields",
    asyncHandler(async (req, res) => {
      try {
        const result = await saveFormFields(req.params.id, req.body.fields);
        res.json(result);
      } catch (error) {
        console.error("Error saving form fields:", error);
        res.status(500).json({ message: error.message });
      }
    })
);
// Mass Email Route
router.post(
    "/applications/send-invites",
    asyncHandler(async (req, res) => {
      const { subject, body } = req.body;
      res.json(await sendMassInvites(subject, body));
    })
);

// Mass Email (UR-B4) — Admin only
router.get(
  "/emails/sources",
  asyncHandler(async (req, res) => res.json(await getEmailSources())),
);
router.get(
  "/emails/templates",
  asyncHandler(async (req, res) => res.json(await getEmailTemplates())),
);
router.post(
  "/emails/templates",
  asyncHandler(async (req, res) => res.json(await createEmailTemplate(req.body))),
);
router.put(
  "/emails/templates/:id",
  asyncHandler(async (req, res) =>
    res.json(await updateEmailTemplate(req.params.id, req.body)),
  ),
);
router.delete(
  "/emails/templates/:id",
  asyncHandler(async (req, res) =>
    res.json(await deleteEmailTemplate(req.params.id)),
  ),
);
router.get(
  "/emails/campaigns",
  asyncHandler(async (req, res) => res.json(await getEmailCampaigns())),
);
router.post(
  "/emails/send",
  asyncHandler(async (req, res) =>
    res.json(await sendEmailCampaign({ ...req.body, userId: req.session.userId })),
  ),
);

router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const message = err && err.message ? err.message : "Internal Server Error";
  const status = err && err.statusCode ? err.statusCode : 500;
  res.status(status).json({ error: message });
});

export default router;



