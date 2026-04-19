import { asyncWrapProviders } from "async_hooks";
import imagekit from "../configs/imageKit.js";
import User from "../models/User.js";
import fs from "fs";
import Connection from "../models/Connection.js";
import Post from "../models/post.js";
import Notification from "../models/notification.js";
import { sendEvent, isUserOnline } from "../utils/sse.js";

//get user data using userId

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// update user data

export const updatedUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) return res.json({ success: false, message: "Unauthorized" });

    const tempUser = await User.findById(userId);
    if (!tempUser)
      return res.json({ success: false, message: "User not found" });

    let { username, bio, location, link, full_name } = req.body;
    if (!username) username = tempUser.username;

    if (tempUser.username !== username) {
      const exists = await User.findOne({ username });
      if (exists) username = tempUser.username;
    }

    const updatedData = { username };
    if (bio !== undefined) updatedData.bio = bio;
    if (location !== undefined) updatedData.location = location;
    if (link !== undefined) updatedData.link = link;
    if (full_name !== undefined) updatedData.full_name = full_name;

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      updatedData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname, // ✅ المهم
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "512" },
        ],
      });

      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    return res.json({ success: true, user, message: "updated successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// find users using username , email , location and name

export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;
    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });
    const filteredUsers = allUsers.filter((user) => user._id != userId);

    const pendingRequests = await Connection.find({
      from_user_id: userId,
      status: "pending",
    });

    const pendingSet = new Set(pendingRequests.map((c) => c.to_user_id.toString()));

    const usersWithStatus = filteredUsers.map((user) => ({
      ...user.toObject(),
      hasPendingRequest: pendingSet.has(user._id.toString()),
    }));

    res.json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Follow user

export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const user = await User.findById(userId);

    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You already following this user ",
      });
    }

    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();
    res.json({ success: true, message: "Now you are following this user" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Unfollow user

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const user = await User.findById(userId);
    user.following = user.following.filter((user) => user !== id);
    await user.save();
    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((user) => user !== userId);
    await toUser.save();
    res.json({
      success: true,
      message: "You are no longer following this user",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hours },
    });
    if (connectionRequests.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have sent more than 20 connection requests in the last 24 hours",
      });
    }
    const existingConnection = await User.findOne({
      _id: userId,
      connections: id
    });

    if (existingConnection) {
      return res.json({
        success: false,
        message: "You are already connected",
      });
    }

    const user = await User.findById(userId);
    const toUser = await User.findById(id);

    user.connections.push(id);
    user.followers.push(id);
    user.following.push(id);
    await user.save();

    toUser.connections.push(userId);
    toUser.followers.push(userId);
    toUser.following.push(userId);
    await toUser.save();

    const notification = await Notification.create({
      recipient: id,
      sender: userId,
      type: "connection_accepted"
    });
    const populatedNotification = await Notification.findById(notification._id).populate("sender", "full_name username profile_picture");
    sendEvent(id, populatedNotification, "notification");

    return res.json({
      success: true,
      message: "Connected successfully",
    });

    return res.json({
      success: false,
      message: "Connection request already exists",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user connections
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following"
    );
    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;
    
    res.json({
      success: true,
      connections,
      followers,
      following
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });
    if (!connection) {
      return res.json({ success: false, message: "connection not found" });
    }
    const user = await User.findById(userId);
    user.connections.push(id);
    user.followers.push(id);
    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    toUser.followers.push(userId);
    toUser.following.push(userId);
    await toUser.save();

    connection.status = "accepted";
    await connection.save();
    res.json({ success: true, message: "Connection accepted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { profileId } = req.body;
    
    let profile = await User.findById(profileId).populate(
      "connections followers following",
      "full_name username profile_picture bio"
    );

    if (userId === profileId) {
        await profile.populate({
          path: "saved_posts",
          populate: {
            path: "user",
            select: "full_name username profile_picture"
          }
        });
    }

    if (!profile) {
      return res.json({ success: false, message: "Profile not found" });
    }

    // Add online status
    const profileObj = profile.toObject();
    profileObj.isOnline = isUserOnline(profileId);
    // lastSeen will already be in profile from DB
    
    const posts = await Post.find({ user: profileId })
      .populate("user")
      .populate({ path: "repost_of", populate: { path: "user" } })
      .sort({ createdAt: -1 });

    const likedPosts = await Post.find({ likes_count: profileId })
      .populate("user")
      .populate({ path: "repost_of", populate: { path: "user" } })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, profile: profileObj, posts, likedPosts });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
