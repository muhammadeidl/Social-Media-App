import express from "express";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import {
  addPost,
  getFeedPosts,
  likePost,
  deletePost,
  savePost,
  sharePost,
  summarizePost,
  editPost,
  repostAction,
} from "../controllers/postController.js";
import { requireAuth } from "@clerk/express";

const postRouter = express.Router();

postRouter.post("/add", requireAuth(), upload.array("images", 4), addPost);
postRouter.get("/feed", requireAuth(), getFeedPosts);
postRouter.post("/like", requireAuth(), likePost);
postRouter.post("/delete", requireAuth(), deletePost);
postRouter.post("/edit", requireAuth(), editPost);
postRouter.post("/save", requireAuth(), savePost);
postRouter.post("/share", requireAuth(), sharePost);
postRouter.post("/repost", requireAuth(), repostAction);
postRouter.post("/summarize", requireAuth(), summarizePost);

export default postRouter;
