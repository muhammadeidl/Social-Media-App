import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: String, required: true }, // clerk userId
    text: { type: String, required: true, trim: true, maxlength: 500 },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: [{ type: String }], // clerk userIds
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
