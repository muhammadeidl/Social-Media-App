import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";
import { GoogleGenAI } from "@google/genai";

export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, media_type, background_color } = req.body;

    // --- AI MODERATION STEP ---
    try {
        if (process.env.GEMINI_API_KEY) {
            let promptContents = [
                { text: `You are a strict community moderator for a social media app. Analyze the following content (text and images) and determine if it contains ANY of the following: profanity, swear words, curse words (in any language, including Arabic like words "fuck", "shit", etc), NSFW, +18 content, nudity, hate speech, severe harassment, extreme toxicity, explicit spam, or inappropriate language.
            
            Content text: "${content || "(No text)"}"
            
            Reply ONLY with "yes" if it violates these rules, or "no" if it is acceptable. Do not add any punctuation.` }
            ];

            const media = req.file || req.files?.media?.[0];

            if (media && media_type === "image") {
                const fileBuffer = fs.readFileSync(media.path);
                promptContents.push({
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: media.mimetype
                    }
                });
            }

            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const moderationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptContents,
            });

            const aiJudgment = moderationResponse.text.trim().toLowerCase();

            if (aiJudgment.includes("yes")) {
                if (media) {
                    try { fs.unlinkSync(media.path); } catch (_) {}
                }
                return res.json({ success: false, message: "This story violates our community guidelines. Profanity, racism, hate speech, and +18 content are strictly prohibited." });
            }
        }
    } catch (moderationError) {
        console.error("Moderation AI Error:", moderationError);
        const media = req.file || req.files?.media?.[0];
        if (media) {
            try { fs.unlinkSync(media.path); } catch (_) {}
        }
        return res.json({ success: false, message: "AI Moderation service is temporarily unavailable. Please try again in a few seconds." });
    }
    // --- END AI MODERATION STEP ---

    let media_url = "";

    // ✅ تعريف media (يدعم multer single أو fields)
    const media = req.file || req.files?.media?.[0];

    if (media_type === "image" || media_type === "video") {
      if (!media) {
        return res.json({ success: false, message: "Media file is required" });
      }

      const fileBuffer = fs.readFileSync(media.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });

      media_url = response.url;

      // اختياري: حذف الملف المؤقت بعد الرفع
      try {
        fs.unlinkSync(media.path);
      } catch (_) {}
    }

    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });

    await inngest.send({
      name: "app/story.delete",
      data: { storyId: story._id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//Get User Stories
export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const userIds = [userId, ...user.connections, ...user.following];
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      user: { $in: userIds },
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate("user")
      .sort({ createdAt: -1 });

    return res.json({ success: true, stories });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

// Delete Story
export const deleteStory = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { storyId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.json({ success: false, message: "Story not found" });
    }

    if (story.user.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    await Story.findByIdAndDelete(storyId);

    return res.json({ success: true, message: "Story deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
