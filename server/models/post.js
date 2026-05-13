import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: String, ref: "User", required: true },
    content: { type: String },
    image_urls: [{ type: String }],
    post_type: {
      type: String,
      enum: ["text", "image", "text_with_image", "repost", "quote"],
      required: true,
    },

    comments_count: { type: Number, default: 0 },
    likes_count: [{ type: String, ref: "User" }],
    reactions: { type: Map, of: String, default: {} }, // userId → emoji
    
    // Repost/Quote support
    reposts_count: [{ type: String, ref: "User" }],
    repost_of: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true, minimize: false }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
