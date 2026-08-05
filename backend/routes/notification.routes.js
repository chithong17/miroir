import { Router } from "express";
import { requireUser } from "../middlewares/userAuth.middleware.js";
import { readUserNotification, userNotifications } from "../controllers/notification.controller.js";
const router = Router();
router.use(requireUser);
router.get("/", userNotifications);
router.patch("/:id/read", readUserNotification);
export default router;
