import { GoogleGenAI } from "@google/genai";

// Using Gemini AI with user's API key
// Model: gemini-2.5-flash (newest, fastest, cost-effective)
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export default ai;
