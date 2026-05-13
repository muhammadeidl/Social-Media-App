import express from "express";
import { chat } from "../controllers/aiController.js";
import { requireAuth } from "@clerk/express";

const aiRoutes = express.Router();

aiRoutes.post("/chat", requireAuth(), chat);

export default aiRoutes;
