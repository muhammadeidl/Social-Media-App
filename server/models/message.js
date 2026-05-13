import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User", required: true },
    text: { type: String, trim: true },
    message_type: { type: String, enum: ["text", "image", "post"] },
    media_url: { type: String },
    shared_post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    seen: { type: Boolean, default: false },
    deleted_by: [{ type: String, ref: "User" }],
  },
  { timestamps: true, minimize: false }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
