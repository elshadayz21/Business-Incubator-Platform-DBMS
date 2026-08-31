import { Router } from "express";
import { searchEntities } from "../../controllers/search/search.controller.js";

const router = Router();

// Public content search must work without an account.
router.get("/", searchEntities);

export { router as SearchRouter };
