import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Basic AI Chatbot
export const chat = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const { message } = req.body;
    if (!message) {
      return res.json({ success: false, message: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ success: false, message: "AI API Key not configured." });
    }

    const prompt = `You are a helpful, friendly AI assistant built into the Postly social media application.
Keep your answers very short, concise, and conversational. Use emojis.
The user is asking: "${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reply = response.text.trim();

    return res.json({ success: true, reply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.json({ success: false, message: "Failed to generate AI response." });
  }
};
