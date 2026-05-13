import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are a strict community moderator for a social media app. Analyze the following content and determine if it contains ANY of the following: profanity, swear words, curse words (in any language, including Arabic like words "fuck", "shit", etc), NSFW, +18 content, hate speech, severe harassment, extreme toxicity, explicit spam, or inappropriate language.
Content: "fuck you so much"
Reply ONLY with "yes" if it violates these rules, or "no" if it is acceptable. Do not add any punctuation.`;
  
  const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
  console.log('AI says:', res.text);
}
run().catch(console.error);
