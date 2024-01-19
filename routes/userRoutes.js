import { Router } from "express";
const router = Router();
import { userController } from "../controllers/index.js";

router.get("/login", userController.saveUsers);
router.get("/", userController.createUser);
router.route("/available-slots").post(userController.getAvailableSlots);
router.route("/create-meeting").post(userController.createMeeting);
router.route("/get-all-events").post(userController.getAllEvents);
router.route("/update-meeting").post(userController.updateEvent);
router.route("/delete-meeting").post(userController.deleteEvent);
export default router;
