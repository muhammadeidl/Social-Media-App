import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  addComment,
  getPostComments,
  deleteComment,
  likeComment,
} from "../controllers/commentController.js";

const commentRouter = express.Router();

commentRouter.post("/add", protect, addComment);
commentRouter.post("/delete", protect, deleteComment);
commentRouter.post("/like", protect, likeComment);
commentRouter.get("/:postId", protect, getPostComments);

export default commentRouter;
