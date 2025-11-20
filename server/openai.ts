import OpenAI from "openai";

// Using OpenAI directly with user's API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default openai;
