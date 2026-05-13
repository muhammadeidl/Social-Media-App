import Notification from "../models/notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "full_name username profile_picture")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    } else {
      // Mark all as read
      await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.auth();
    
    await Notification.deleteMany({ recipient: userId });

    res.json({ success: true, message: "All notifications deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
