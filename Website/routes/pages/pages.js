import { Router } from "express";
import {
  getAboutPage,
  getMentorsPage,
  getWorkshopsPage,
  getWorkshopDetailPage,
  getTermsPage,
  getGalleryPage,
  bookMentorSession,
  getStaticPage,
} from "../../controllers/pages/pages.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js";

const router = Router();

router.get("/about", getAboutPage);
router.get("/terms", getTermsPage);
router.get("/mentors", getMentorsPage);
router.post("/mentors/book", isAuth, bookMentorSession);
router.get("/workshop", getWorkshopsPage);
router.get("/workshop/:id", getWorkshopDetailPage);
router.get("/gallery", getGalleryPage);
router.get("/pages/:slug", getStaticPage);

export { router as PagesRouter };
