import express from "express";
import { protect } from "../middlewares/auth.js";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.post("/mark-read", protect, markAsRead);

export default notificationRouter;
