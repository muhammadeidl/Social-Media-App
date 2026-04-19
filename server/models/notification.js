import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: String, ref: "User", required: true },
    sender: { type: String, ref: "User", required: true },
    type: {
      type: String,
      enum: ["message", "connection_request", "connection_accepted", "like", "comment"],
      required: true,
    },
    read: { type: Boolean, default: false },
    related_id: { type: String }, // Can store messageId, connectionId etc. if needed later
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
