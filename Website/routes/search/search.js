import { Router } from "express";
import { searchEntities } from "../../controllers/search/search.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js";

const router = Router();

// Global search is accessible to authenticated users
router.get("/", isAuth, searchEntities);

export { router as SearchRouter };
