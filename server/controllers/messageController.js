import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/message.js";
import Notification from "../models/notification.js";
import { addClient, sendEvent } from "../utils/sse.js";

export const sseController = (req, res) => {
  const { userId } = req.params;
  console.log("New client connected : ", userId);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.flushHeaders?.();

  addClient(userId, res);
};

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text = "", shared_post } = req.body;

    const image = req.file;
    let message_type = "text";
    if (image) message_type = "image";
    else if (shared_post) message_type = "post";

    let media_url = "";
    let response = null;

    if (image) {
      const fileBuffer = fs.readFileSync(image.path);
      response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });

      fs.unlink(image.path, () => {});
    }

    if (response?.filePath) {
      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
      shared_post,
    });

    // ✅ ابعث للطرف الثاني برسالة فيها بيانات المرسل
    const messageWithUserData = await Message.findById(message._id)
      .populate("from_user_id")
      .populate({
        path: "shared_post",
        populate: { path: "user", select: "full_name username profile_picture" }
      });

    // ✅ رجّع للمُرسل نفس الرسالة مع البيانات
    res.json({ success: true, message: messageWithUserData });

    sendEvent(to_user_id, messageWithUserData);

    // Create a notification for the message
    const notification = await Notification.create({
      recipient: to_user_id,
      sender: userId,
      type: "message",
      related_id: message._id
    });
    
    const populatedNotification = await Notification.findById(notification._id).populate("sender", "full_name username profile_picture");
    sendEvent(to_user_id, populatedNotification, "notification");
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
      deleted_by: { $ne: userId }
    })
      .populate({
        path: "shared_post",
        populate: { path: "user", select: "full_name username profile_picture" }
      })
      .sort({ createdAt: -1 }); // ✅

    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();

    const messages = await Message.find({
      $or: [{ to_user_id: userId }, { from_user_id: userId }],
      deleted_by: { $ne: userId }
    })
      .populate("from_user_id to_user_id")
      .populate({
        path: "shared_post",
        populate: { path: "user", select: "full_name username profile_picture" }
      })
      .sort({ createdAt: -1 }); // ✅

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { otherUserId } = req.body;

    if (!otherUserId) return res.json({ success: false, message: "User ID required" });

    // Mark all messages between these two users as deleted by the current user
    await Message.updateMany(
      {
        $or: [
          { from_user_id: userId, to_user_id: otherUserId },
          { from_user_id: otherUserId, to_user_id: userId },
        ],
      },
      {
        $addToSet: { deleted_by: userId },
      }
    );

    res.json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
