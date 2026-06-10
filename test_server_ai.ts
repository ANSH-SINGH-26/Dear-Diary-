import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const tryGemini = async (key: string) => {
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", 
    contents: "hello",
  });
  return response.text;
};

async function run() {
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Trying Gemini...");
      const res = await tryGemini(process.env.GEMINI_API_KEY);
      console.log("Gemini:", res?.substring(0, 50));
    } catch(e: any) {
      console.error("Gemini failed:", e.message);
    }
  } else {
    console.log("No GEMINI_API_KEY");
  }
}
run();
