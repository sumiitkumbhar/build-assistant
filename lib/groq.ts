
import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const groqModel = process.env.GROQ_MODEL || "llama3-70b-8192";
