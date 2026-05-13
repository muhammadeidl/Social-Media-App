import { asyncWrapProviders } from "async_hooks";
import imagekit from "../configs/imageKit.js";
import User from "../models/User.js";
import fs from "fs";
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
    const user = await User.findById(userId);
    const blockedList = [...(user.blockedUsers || []), ...(user.blockedBy || [])];

    const filteredUsers = allUsers.filter((u) => u._id.toString() !== userId && !blockedList.includes(u._id.toString()));

    const usersWithStatus = filteredUsers.map((u) => ({
      ...u.toObject(),
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
    if (!toUser.followers.includes(userId)) {
      toUser.followers.push(userId);
      await toUser.save();
    }
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
    user.following = user.following.filter((uId) => uId.toString() !== id.toString());
    await user.save();
    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((uId) => uId.toString() !== userId.toString());
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

// Block user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    
    if (userId === id) {
      return res.json({ success: false, message: "You cannot block yourself" });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(id);

    if (!user.blockedUsers.includes(id)) {
      user.blockedUsers.push(id);
      
      // Also remove followings/followers relationships if they exist
      user.following = user.following.filter(uId => uId.toString() !== id.toString());
      user.followers = user.followers.filter(uId => uId.toString() !== id.toString());
      
      await user.save();
    }

    if (!targetUser.blockedBy.includes(userId)) {
      targetUser.blockedBy.push(userId);
      
      targetUser.following = targetUser.following.filter(uId => uId.toString() !== userId.toString());
      targetUser.followers = targetUser.followers.filter(uId => uId.toString() !== userId.toString());
      
      await targetUser.save();
    }

    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(id);

    user.blockedUsers = user.blockedUsers.filter((uId) => uId.toString() !== id.toString());
    await user.save();

    targetUser.blockedBy = targetUser.blockedBy.filter((uId) => uId.toString() !== userId.toString());
    await targetUser.save();

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user connections (now only followers/following/blocked)
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "followers following blockedUsers"
    );
    // Deduplicate lists just in case
    const uniqueFollowers = Array.from(new Map(user.followers.map(u => [u._id.toString(), u])).values());
    const uniqueFollowing = Array.from(new Map(user.following.map(u => [u._id.toString(), u])).values());
    const uniqueBlocked = Array.from(new Map(user.blockedUsers.map(u => [u._id.toString(), u])).values());
    
    res.json({
      success: true,
      followers: uniqueFollowers,
      following: uniqueFollowing,
      blockedUsers: uniqueBlocked
    });
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
      "followers following",
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

    const user = await User.findById(userId);
    const blockedList = [...(user.blockedUsers || []), ...(user.blockedBy || [])];

    if (blockedList.includes(profileId)) {
        return res.json({ success: false, message: "User not found or unavailable" });
    }

    // Add online status
    const profileObj = profile.toObject();
    profileObj.isOnline = isUserOnline(profileId);
    
    if (profileObj.followers) {
      profileObj.followers = Array.from(new Map(profileObj.followers.map(u => [u._id.toString(), u])).values());
    }
    if (profileObj.following) {
      profileObj.following = Array.from(new Map(profileObj.following.map(u => [u._id.toString(), u])).values());
    }

    // lastSeen will already be in profile from DB
    
    const posts = await Post.find({ user: profileId })
      .populate("user")
      .populate({ path: "repost_of", populate: { path: "user" } })
      .sort({ createdAt: -1 });

    const likedPosts = await Post.find({ likes_count: profileId })
      .populate("user")
      .populate({ path: "repost_of", populate: { path: "user" } })
      .sort({ createdAt: -1 });

    // Deduplicate liked posts: If a post is a pure repost, we treat it as its `repost_of` post.
    // We only want to show unique content in the likes tab.
    const uniqueLikedPostsMap = new Map();
    likedPosts.forEach(post => {
      const actualPostId = (post.post_type === "repost" && post.repost_of) ? post.repost_of._id.toString() : post._id.toString();
      if (!uniqueLikedPostsMap.has(actualPostId)) {
        uniqueLikedPostsMap.set(actualPostId, post);
      }
    });
    const uniqueLikedPostsArray = Array.from(uniqueLikedPostsMap.values());
    
    res.json({ success: true, profile: profileObj, posts, likedPosts: uniqueLikedPostsArray });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
