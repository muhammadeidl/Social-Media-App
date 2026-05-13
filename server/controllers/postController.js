import fs from "fs";
import imageKit from "../configs/imageKit.js";
import Post from "../models/post.js";
import User from "../models/User.js";
import Notification from "../models/notification.js";
import { sendEvent } from "../utils/sse.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { content, post_type } = req.body;

    // ✅ دعم الحالتين:
    // upload.array("images") => req.files (array)
    // upload.fields([{ name: "images" }]) => req.files.images (array)
    const images = Array.isArray(req.files)
      ? req.files
      : req.files?.images || [];

    // --- AI MODERATION STEP ---
    try {
        if (process.env.GEMINI_API_KEY) {
            let promptContents = [
                { text: `You are a strict community moderator for a social media app. Analyze the following content (text and images) and determine if it contains ANY of the following: profanity, swear words, curse words (in any language, including Arabic like words "fuck", "shit", etc), NSFW, +18 content, nudity, hate speech, severe harassment, extreme toxicity, explicit spam, or inappropriate language.
            
            Content text: "${content || "(No text)"}"
            
            Reply ONLY with "yes" if it violates these rules, or "no" if it is acceptable. Do not add any punctuation.` }
            ];

            if (images && images.length > 0) {
                for (const img of images) {
                    const fileBuffer = fs.readFileSync(img.path);
                    promptContents.push({
                        inlineData: {
                            data: fileBuffer.toString("base64"),
                            mimeType: img.mimetype
                        }
                    });
                }
            }

            const moderationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptContents,
            });

            const aiJudgment = moderationResponse.text.trim().toLowerCase();

            if (aiJudgment.includes("yes")) {
                // Delete temporary files since post is rejected
                if (images.length > 0) {
                    images.forEach(img => {
                        try { fs.unlinkSync(img.path); } catch (_) {}
                    });
                }
                return res.json({ success: false, message: "This post violates our community guidelines. Profanity, racism, hate speech, and +18 content are strictly prohibited." });
            }
        }
    } catch (moderationError) {
        console.error("Moderation AI Error:", moderationError);
        if (images && images.length > 0) {
            images.forEach(img => {
                try { fs.unlinkSync(img.path); } catch (_) {}
            });
        }
        return res.json({ success: false, message: "AI Moderation service is temporarily unavailable. Please try again in a few seconds." });
    }
    // --- END AI MODERATION STEP ---

    let image_urls = [];

    if (images.length > 0) {
      image_urls = await Promise.all(
        images.map(async (img) => {
          const fileBuffer = fs.readFileSync(img.path);

          const response = await imageKit.upload({
            file: fileBuffer,
            fileName: img.originalname,
            folder: "posts",
          });

          // (اختياري) حذف الملف المؤقت بعد الرفع
          try {
            fs.unlinkSync(img.path);
          } catch (_) {}

          const url = imageKit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });

          return url;
        })
      );
    }

    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });

    return res.json({ success: true, message: "Post Created successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Get Feed Posts
export const getFeedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userIds = [userId, ...user.following];

    // Combine blockedUsers and blockedBy to form an exclusion list
    const blockedList = [...(user.blockedUsers || []), ...(user.blockedBy || [])];

    // Filter userIds to ensure we don't fetch from blocked
    const validUserIds = userIds.filter(id => !blockedList.includes(id.toString()));

    const posts = await Post.find({
      user: { $in: validUserIds, $nin: blockedList }
    })
      .populate("user")
      .populate({
        path: "repost_of",
        populate: { path: "user" },
      })
      .sort({ createdAt: -1 });

    // Filter out posts that are reposts of blocked users' posts
    const filteredPosts = posts.filter(post => {
      if (post.repost_of && post.repost_of.user && blockedList.includes(post.repost_of.user._id.toString())) {
        return false;
      }
      return true;
    });

    return res.json({ success: true, posts: filteredPosts });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Like / Unlike Post
export const likePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { postId, reaction = "👍" } = req.body;
    if (!postId) {
      return res.json({ success: false, message: "postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (!Array.isArray(post.likes_count)) {
      post.likes_count = [];
    }

    const alreadyLiked = post.likes_count.includes(userId);

    if (alreadyLiked) {
      // Remove like and reaction
      post.likes_count = post.likes_count.filter((u) => u !== userId);
      post.reactions.delete(userId);
    } else {
      // Add like and store reaction emoji
      post.likes_count.push(userId);
      post.reactions.set(userId, reaction);
    }

    post.post_type = post.post_type || "text";
    await post.save();

    // Send notification to post owner
    if (!alreadyLiked && post.user.toString() !== userId) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: userId,
        type: "like",
        related_id: postId,
      });

      const populatedNotification = await Notification.findById(notification._id).populate(
        "sender",
        "full_name username profile_picture"
      );
      sendEvent(post.user.toString(), populatedNotification, "notification");
    }

    return res.json({
      success: true,
      message: alreadyLiked ? "Post unliked" : "Post liked",
      likes_count: post.likes_count,
      reactions: Object.fromEntries(post.reactions), // Convert Map to plain object
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // If this post is a repost/quote, update the original post's reposts_count
    if (post.repost_of) {
        const originalPost = await Post.findById(post.repost_of);
        if (originalPost) {
            originalPost.reposts_count = originalPost.reposts_count.filter(id => id !== userId);
            await originalPost.save();
        }
    }

    await Post.findByIdAndDelete(postId);

    return res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Save Post
export const savePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId } = req.body;

    const user = await User.findById(userId);

    if (user.saved_posts.includes(postId)) {
      user.saved_posts = user.saved_posts.filter((id) => id !== postId);
      await user.save();
      return res.json({ success: true, message: "Post unsaved" });
    } else {
      user.saved_posts.push(postId);
      await user.save();
      return res.json({ success: true, message: "Post saved" });
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Share Post
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.json({ success: false, message: "postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    // Increment shares count
    post.shares_count = (post.shares_count || 0) + 1;
    await post.save();

    return res.json({ 
        success: true, 
        message: "Post shared successfully",
        shares_count: post.shares_count 
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};


// AI Summarize Post
export const summarizePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) return res.json({ success: false, message: "Unauthorized" });

    const { postId } = req.body;
    if (!postId) return res.json({ success: false, message: "postId is required" });

    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });
    
    if (!post.content || post.content.length < 50) {
        return res.json({ success: false, message: "Post is too short to summarize" });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.json({ success: false, message: "AI API Key not configured." });
    }

    const prompt = `Summarize the following social media post into one concise, engaging sentence. Keep it very short.
    
    Post: "${post.content}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const summary = response.text.trim();

    return res.json({ success: true, summary });
  } catch (error) {
    console.error("AI Summary Error:", error);
    return res.json({ success: false, message: "Failed to generate AI summary." });
  }
};

// Edit Post
export const editPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, content } = req.body;

    // --- AI MODERATION STEP ---
    try {
        if (process.env.GEMINI_API_KEY) {
            const prompt = `You are a strict community moderator for a social media app. Analyze the following content and determine if it contains ANY of the following: profanity, swear words, curse words (in any language, including Arabic like words "fuck", "shit", etc), NSFW, +18 content, hate speech, severe harassment, extreme toxicity, explicit spam, or inappropriate language.
            
            Content text: "${content || "(No text)"}"
            
            Reply ONLY with "yes" if it violates these rules, or "no" if it is acceptable. Do not add any punctuation.`;

            const moderationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const aiJudgment = moderationResponse.text.trim().toLowerCase();

            if (aiJudgment.includes("yes")) {
                return res.json({ success: false, message: "This post violates our community guidelines. Profanity, racism, hate speech, and +18 content are strictly prohibited." });
            }
        }
    } catch (moderationError) {
        console.error("Moderation AI Error:", moderationError);
        return res.json({ success: false, message: "AI Moderation service is temporarily unavailable. Please try again in a few seconds." });
    }
    // --- END AI MODERATION STEP ---

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    post.content = content;
    await post.save();

    return res.json({ success: true, message: "Post updated successfully", post });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Repost / Quote Post
export const repostAction = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) return res.json({ success: false, message: "Unauthorized" });

    const { postId, content } = req.body; // if content exists, it's a quote
    if (!postId) return res.json({ success: false, message: "postId is required" });

    let originalPost = await Post.findById(postId);
    if (!originalPost) return res.json({ success: false, message: "Post not found" });

    // Prevent reposting a repost
    if (originalPost.post_type === "repost" && originalPost.repost_of) {
        originalPost = await Post.findById(originalPost.repost_of);
        if (!originalPost) return res.json({ success: false, message: "Original post not found" });
    }

    const actualPostId = originalPost._id;

    if (content && content.trim().length > 0) {
      // Create a Quote
      const newQuote = await Post.create({
        user: userId,
        content: content,
        post_type: "quote",
        repost_of: actualPostId,
      });

      // Increment reposts_count on original post
      if (!Array.isArray(originalPost.reposts_count)) {
        originalPost.reposts_count = [];
      }
      if (!originalPost.reposts_count.includes(userId)) {
          originalPost.reposts_count.push(userId);
      }
      await originalPost.save();

      // Send notification for quote
      if (originalPost.user.toString() !== userId) {
          const notification = await Notification.create({
            recipient: originalPost.user,
            sender: userId,
            type: "repost",
            related_id: actualPostId,
          });
          const populatedNotification = await Notification.findById(notification._id).populate(
            "sender",
            "full_name username profile_picture"
          );
          sendEvent(originalPost.user.toString(), populatedNotification, "notification");
      }

      return res.json({ success: true, message: "Quote posted successfully", post: newQuote });
    } else {
      // Toggle pure Repost
      const existingRepost = await Post.findOne({
        user: userId,
        repost_of: actualPostId,
        post_type: "repost"
      });

      const hasReposted = Array.isArray(originalPost.reposts_count) && originalPost.reposts_count.includes(userId);

      if (existingRepost || hasReposted) {
        // Un-repost
        if (existingRepost) {
            await Post.findByIdAndDelete(existingRepost._id);
        }
        if (hasReposted) {
            originalPost.reposts_count = originalPost.reposts_count.filter((u) => u.toString() !== userId);
            await originalPost.save();
        }
        return res.json({ success: true, message: "Repost removed" });
      } else {
        // Create Repost
        const newRepost = await Post.create({
          user: userId,
          post_type: "repost",
          repost_of: actualPostId,
        });
        if (!Array.isArray(originalPost.reposts_count)) {
            originalPost.reposts_count = [];
        }
        if (!originalPost.reposts_count.includes(userId)) {
             originalPost.reposts_count.push(userId);
        }
        await originalPost.save();

        // Send notification for repost
        if (originalPost.user.toString() !== userId) {
            const notification = await Notification.create({
              recipient: originalPost.user,
              sender: userId,
              type: "repost",
              related_id: actualPostId,
            });
            const populatedNotification = await Notification.findById(notification._id).populate(
              "sender",
              "full_name username profile_picture"
            );
            sendEvent(originalPost.user.toString(), populatedNotification, "notification");
        }

        return res.json({ success: true, message: "Post reposted successfully", post: newRepost });
      }
    }
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
