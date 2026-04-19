import express from "express";

import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
  acceptConnectionRequest,
  discoverUsers,
  followUser,
  getUserConnections,
  getUserData,
  sendConnectionRequest,
  unfollowUser,
  updatedUserData,
  getUserProfile,
} from "../controllers/userController.js";
import { getUserRecentMessages } from "../controllers/messageController.js";

const userRouter = express.Router();

userRouter.get("/data", protect, getUserData);
userRouter.post(
  "/update",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  protect,
  updatedUserData
);

userRouter.post("/discover", protect, discoverUsers);

userRouter.post("/follow", protect, followUser);

userRouter.post("/unfollow", protect, unfollowUser);

userRouter.post("/connect", protect, sendConnectionRequest);

userRouter.post("/accept", protect, acceptConnectionRequest);

userRouter.get("/connections", protect, getUserConnections);

userRouter.post("/profiles", protect, getUserProfile);

userRouter.get("/recent-messages", protect, getUserRecentMessages);

export default userRouter;
