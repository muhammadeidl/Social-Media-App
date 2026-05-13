import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    link: { type: String, default: "" },
    profile_picture: { type: String, default: "" },
    cover_photo: { type: String, default: "" },
    is_verified: { type: Boolean, default: false },
    followers: [{ type: String, ref: "User" }],
    following: [{ type: String, ref: "User" }],
    connections: [{ type: String, ref: "User" }],
    saved_posts: [{ type: String, ref: "Post" }],
    blockedUsers: [{ type: String, ref: "User" }],
    blockedBy: [{ type: String, ref: "User" }],
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, minimize: false }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
