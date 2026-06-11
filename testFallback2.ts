import dotenv from "dotenv";
dotenv.config();

console.log("GEMINI:", process.env.GEMINI_API_KEY ? "set" : "unset");
console.log("GROQ:", process.env.GROQ_API_KEY ? "set" : "unset");
console.log("OPENROUTER:", process.env.OPENROUTER_API_KEY ? "set" : "unset");
