import { Router } from "express";
import {
  createProjectController,
  newProjectPage,
  projectsController,
  projectDetailController,
  getSuggestedMentorsController, // <-- Add this!
} from "../../controllers/project/project.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js";

const router = Router();

router.get("/", projectsController);
router.get("/new", newProjectPage);

// Add this line right here! ABOVE /:id
router.get("/:id/suggested-mentors", getSuggestedMentorsController);

router.get("/:id", projectDetailController);
router.post("/create", isAuth, createProjectController);
export default router;


