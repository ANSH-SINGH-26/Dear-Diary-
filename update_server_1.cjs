const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

// Replace imports
serverContent = serverContent.replace(
  'import { GoogleGenAI } from "@google/genai";',
  'import Groq from "groq-sdk";'
);

// Replace getAi
serverContent = serverContent.replace(
  /const getAi = \(\) => \{[\s\S]*?return new GoogleGenAI\(\{ [\s\S]*?\}\);\n\};/,
  `const getAi = () => {
  let apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "MY_GROQ_API_KEY" || apiKey.trim() === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new Groq({ apiKey });
};`
);

// Update debug endpoint
serverContent = serverContent.replace(
  /key: \(process\.env\.API_KEY_GEMINI \|\| process\.env\.API_KEY\),/g,
  'key: process.env.GROQ_API_KEY,'
);
serverContent = serverContent.replace(
  /\(process\.env\.API_KEY_GEMINI \|\| process\.env\.API_KEY\)\?/g,
  'process.env.GROQ_API_KEY?'
);

// Utility for errors
const errorCatchBlock = `} catch (error: any) {
    if (error.message === "API_KEY_MISSING") {
      return res.status(500).json({ error: "Please configure your Groq API Key in the Secrets panel." });
    }
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota") || error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE")) {
      return res.status(503).json({ error: "The AI is experiencing high demand or quota limits. Please try again in a moment." });
    }`;

serverContent = serverContent.replace(/\} catch \(error: any\) \{[\s\S]*?if \(error\?\.status === 429[\s\S]*?\}\n/g, errorCatchBlock + '\\n');

fs.writeFileSync('server.ts', serverContent);
console.log("Replaced imports, getAi, debug and errors. Now doing routes...");
