import {
  getAllWorkshopsQuery,
  getWorkshopByIdQuery,
  joinWorkshopQuery,
  leaveWorkshopQuery,
  checkEnrollmentQuery,
} from "../../models/workshop/Workshop.js";
import eventBus from "../../utils/eventBus.js";

// 1. Get All
export const getAllWorkshops = async (req, res, next) => {
  try {
    const workshops = await getAllWorkshopsQuery();

    res.json({
      status: "success",
      results: workshops.length,
      data: { workshops },
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get One
export const getOneWorkshop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workshop = await getWorkshopByIdQuery(id);

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    res.json({
      status: "success",
      data: { workshop },
    });
  } catch (err) {
    next(err);
  }
};

// 3. Attend
export const attendWorkshop = async (req, res, next) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user.id;
    // Get name and email from authenticated user
    const entrepreneurName = req.user.name;
    const entrepreneurEmail = req.user.email;

    console.log(
      "Enroll request - Name:",
      entrepreneurName,
      "Email:",
      entrepreneurEmail,
    );

    // Validate workshop exists
    const workshop = await getWorkshopByIdQuery(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    // Check if already enrolled
    const isEnrolled = await checkEnrollmentQuery(workshopId, userId);
    if (isEnrolled) {
      return res
        .status(400)
        .json({ message: "You have already enrolled in this workshop." });
    }

    // Enroll in workshop
    const result = await joinWorkshopQuery(
      workshopId,
      userId,
      entrepreneurName,
      entrepreneurEmail,
    );

    if (!result) {
      return res.status(400).json({ message: "Could not enroll in workshop." });
    }

    // Emit event for subscribers
    eventBus.emit("workshop.enrolled", { enrollment: { workshop_id: workshopId, user_id: userId } });

    res.json({
      status: "success",
      message: "You have successfully enrolled in the workshop!",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// 4. Cancel Attendance
export const cancelAttendance = async (req, res, next) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user.id;

    const result = await leaveWorkshopQuery(workshopId, userId);

    if (!result) {
      return res
        .status(400)
        .json({ message: "You are not attending this workshop anyway." });
    }

    // Emit event for subscribers
    eventBus.emit("workshop.cancelled", { enrollment: { workshop_id: workshopId, user_id: userId } });

    res.json({
      status: "success",
      message: "Attendance cancelled successfully.",
    });
  } catch (err) {
    next(err);
  }
};
