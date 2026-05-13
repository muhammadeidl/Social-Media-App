import express from "express";
import { protect } from "../middlewares/auth.js";
import { getNotifications, markAsRead, deleteAllNotifications } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.post("/mark-read", protect, markAsRead);
notificationRouter.delete("/delete-all", protect, deleteAllNotifications);

export default notificationRouter;
