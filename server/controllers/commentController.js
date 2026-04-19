import Comment from "../models/comment.js";
import Post from "../models/post.js";
import User from "../models/User.js";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const addComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { postId, text } = req.body;

    if (!userId) return res.json({ success: false, message: "Unauthorized" });
    if (!postId || !text?.trim())
      return res.json({
        success: false,
        message: "postId and text are required",
      });

    // --- AI Content Moderation ---
    try {
      if (process.env.GEMINI_API_KEY && text) {
        const prompt = `You are a strict community moderator for a social media app. Analyze the following content and determine if it contains ANY of the following: profanity, swear words, curse words (in any language, including Arabic like words "fuck", "shit", etc), NSFW, +18 content, hate speech, severe harassment, extreme toxicity, explicit spam, or inappropriate language.
        
        Content: "${text.trim()}"
        
        Reply ONLY with "yes" if it violates these rules, or "no" if it is acceptable. Do not add any punctuation.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const aiJudgment = response.text.trim().toLowerCase();
        
        if (aiJudgment.includes("yes")) {
            return res.json({ 
                success: false, 
                message: "This comment violates our community guidelines. Profanity, racism, hate speech, and +18 content are strictly prohibited." 
            });
        }
      }
    } catch (aiError) {
      console.error("AI Moderation Error:", aiError);
      return res.json({ success: false, message: "AI Moderation service is temporarily unavailable. Please try again in a few seconds." });
    }
    // -----------------------------

    const post = await Post.findById(postId);
    if (!post) return res.json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      post: postId,
      user: userId,
      text: text.trim(),
    });

    post.comments_count = (post.comments_count || 0) + 1;
    await post.save();

    // رجّع مع بيانات المستخدم (حتى تعرض الاسم والصورة)
    const user = await User.findById(userId).select(
      "full_name username profile_picture"
    );
    return res.json({
      success: true,
      comment: { ...comment.toObject(), user },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).sort({
      createdAt: -1,
    });

    // جلب بيانات المستخدم لكل comment (حسب تصميمك)
    // إذا عندك user as ObjectId بدل clerk id، نعمل populate بدل هذا.
    const userIds = [...new Set(comments.map((c) => c.user))];
    const users = await User.find({ _id: { $in: userIds } }).select(
      "full_name username profile_picture"
    );
    const usersMap = new Map(users.map((u) => [String(u._id), u]));

    const enriched = comments.map((c) => ({
      ...c.toObject(),
      user: usersMap.get(String(c.user)) || null,
    }));

    return res.json({ success: true, comments: enriched });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { commentId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.json({ success: false, message: "Comment not found" });

    const post = await Post.findById(comment.post);
    if (!post) return res.json({ success: false, message: "Post not found" });

    // Allow deletion if user is comment owner OR post owner
    if (comment.user !== userId && post.user !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    await Comment.findByIdAndDelete(commentId);

    // Decrement comments count
    if (post.comments_count > 0) {
      post.comments_count -= 1;
      await post.save();
    }

    return res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
