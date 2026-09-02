import express from "express";
import { publicAttendWorkshop } from "../../controllers/workshop/workshop.controller.js"; // add to existing import
import {
  getAllWorkshops,
  getOneWorkshop,
  attendWorkshop,
  cancelAttendance,
} from "../../controllers/workshop/workshop.controller.js";
import { isAuth } from "../../middleware/auth.middlware.js"


const router = express.Router();


// Public Routes
router.get("/", getAllWorkshops);
router.get("/:id", getOneWorkshop);

// Protected Routes
router.post("/:id/attend", isAuth, attendWorkshop);
router.delete("/:id/attend", isAuth, cancelAttendance);


// Public (anonymous) enrollment — no login required
router.post("/:id/attend-public", publicAttendWorkshop);
export default router;
