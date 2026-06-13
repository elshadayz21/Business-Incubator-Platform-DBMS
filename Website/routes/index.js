import { Router } from "express";
import { AuthRouter } from "./auth/auth.js";
import { PagesRouter } from "./pages/pages.js";
import ProjectsRoutes from "./projects/project.js";
import workshopRoutes from "./workshop/workshop.js";
import fundingRoutes from "./funding/funding.js";
import { SearchRouter } from "./search/search.js";

const router = Router();

router.use("/", PagesRouter);
router.use("/auth", AuthRouter);
router.use("/projects", ProjectsRoutes);
router.use("/workshop", workshopRoutes);
router.use("/funding", fundingRoutes);
router.use("/search", SearchRouter);

export { router as GlobalRouter };
