import { Router } from "express";
import {
  getAboutPage,
  getMentorsPage,
  getWorkshopsPage,
  getWorkshopDetailPage,
  bookMentorSession,
} from "../../controllers/pages/pages.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js";

const router = Router();

router.get("/about", getAboutPage);
router.get("/mentors", getMentorsPage);
router.post("/mentors/book", isAuth, bookMentorSession);
router.get("/workshop", getWorkshopsPage);
router.get("/workshop/:id", getWorkshopDetailPage);

export { router as PagesRouter };
