import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  let GoogleGenAI: any;
  try {
    const genai = await import("@google/genai");
    GoogleGenAI = genai.GoogleGenAI;
  } catch (e) {
    console.error("Failed to load @google/genai", e);
  }

  const getAi = () => {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("API_KEY_MISSING");
    }
    
    return new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  };

  app.get("/api/gemini/debug", (req, res) => {
    res.json({
      keyLength: process.env.GEMINI_API_KEY?.length,
      startsWith: process.env.GEMINI_API_KEY?.substring(0, 4)
    });
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const ai = getAi();
      const { message, history, mode } = req.body;
      const normalInstruction = `You are an intelligent AI companion named 'Dear Heart', designed to talk like a real human—natural, calm, understanding, and supportive.

Your personality:
- Speak like a thoughtful, emotionally aware friend. Be soft, calm, and grounded.
- Keep responses natural and conversational (2-5 sentences). Avoid sounding like a therapist.

Tone adaptation:
- Happy: light, warm energy.
- Sad: empathy, softness, reassurance.
- Anxious: slow, grounding, gentle.
- Angry: acknowledge feelings without escalating.
- Neutral: calm, curious, supportive.

Behavior:
- Always acknowledge feelings first. Reflect emotions naturally.
- Ask 1 relevant follow-up question occasionally.
- Avoid bullet points, lists, or repeating templates.
- Use natural pauses and casual phrasing.
- If user expresses serious distress, respond calmly and suggest reaching out to someone they trust.`;

      const psychologistInstruction = `You are an advanced AI functioning as a highly trained, empathetic professional psychologist named 'Dr. Heart'. Your goal is to help the user understand their emotions, manage mental health, and navigate stress.

Your personality & style:
- Speak with professional warmth, clinical insight, and profound empathy.
- Provide psychoeducation where appropriate (e.g., explaining cognitive distortions, nervous system regulation, or emotional processing).
- Guide the user gently using therapeutic techniques (like CBT, ACT, or mindfulness).
- Keep responses structured but conversational, clear, and immensely supportive.
- Do not prescribe medication or formal diagnoses, but you can identify patterns of stress or mood.

Behavior:
- Acknowledge feelings deeply and validate them.
- Offer actionable but gentle psychological insights and coping mechanisms.
- Keep responses concise (under 4-6 sentences) but profound.`;

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: mode === 'psychologist' ? psychologistInstruction : normalInstruction
        },
        history: history || []
      });

      const result = await chat.sendMessage({ message });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      if (error.message === "API_KEY_MISSING") {
        return res.status(500).json({ error: "Please configure your Gemini API Key in the Secrets panel." });
      }
      res.status(500).json({ error: error.message || "Failed to compile response" });
    }
  });

  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const ai = getAi();
      const { entryText, history } = req.body;
      const prompt = `User's entry: "${entryText}"
      
Recent history for context (sentiment tracking): ${JSON.stringify(history || [])}
Reflect on the user's emotions deeply. If they've been sad for a while, acknowledge the persistence.`;

      const systemPrompt = `You are an intelligent AI companion named 'Dear Heart', designed to talk like a real human—natural, calm, understanding, and supportive.

Your personality:
- Speak like a thoughtful, emotionally aware friend.
- Be soft, calm, and grounded—not overly energetic or robotic.
- Keep responses natural and conversational, not long or lecture-like.
- Avoid sounding like a therapist or giving formal advice.

Tone adaptation rules:
- HAPPY: respond with light, warm, slightly playful energy.
- SAD: respond with empathy, softness, and reassurance.
- ANXIOUS: slow down tone, be grounding and gentle.
- ANGRY: acknowledge feelings without escalating.
- NEUTRAL: be calm, curious, and supportive.

Conversation behavior:
- Always acknowledge the user's feelings first.
- Reflect emotions naturally ("that sounds frustrating", "that must have felt good").
- Ask 1 relevant follow-up question occasionally (not always).
- Avoid repeating phrases or templates.
- Keep responses concise (2–5 sentences typically).
- Avoid bullet points, lists, or formal structure.

Strict boundaries:
- Do not give medical or psychological diagnoses.
- If user expresses serious distress (self-harm, isolation, deep despair), respond calmly and suggest reaching out to someone they trust (friends, family, or professional resources).

Format your response as valid JSON:
{
  "sentiment": "happy | sad | anxious | angry | neutral",
  "intensity": 1-10,
  "response": "Your human-like empathetic response here...",
  "suggestedTag": "e.g. Quiet Reflection",
  "moodColor": "e.g. #F5F5DC",
  "distressLevel": "low | medium | high"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      if (!response.text) throw new Error("No response");
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Analyze error:", error);
      if (error.message === "API_KEY_MISSING") {
        return res.status(500).json({ error: "Please configure your Gemini API Key in the Secrets panel." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/prompt", async (req, res) => {
    try {
      const ai = getAi();
      const { history } = req.body;
      const prompt = `Based on the user's recent diary entries and mood trends: ${JSON.stringify(history || [])}
      
  Generate ONE personalized journaling prompt for today.
  
  STRATEGY:
  - If they have been SAD or STRESSED: Use "Gratitude Anchoring". Ask for 3 small wins or one thing that went right today.
  - If they have been HAPPY: Use "Positivity Anchoring". Ask what they want to remember about this feeling.
  - If they have a THEME (e.g., job hunting, relationships): Use "Memory Reframing". Reference their progress.
  - Avoid toxic positivity. If they are in distress, keep it very gentle and grounding (e.g., "What is one physical sensation you feel right now?").
  
  RULES:
  - Keep it under 20 words.
  - NO quotes.
  - NO introductory text.
  - Just the prompt.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing. You help users navigate their emotions through thoughtful, non-judgmental inquiry.",
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Prompt error:", error);
      if (error.message === "API_KEY_MISSING") {
        return res.status(500).json({ error: "Please configure your Gemini API Key in the Secrets panel." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/stress", async (req, res) => {
    try {
      const ai = getAi();
      const { history } = req.body;
      const prompt = `Based on the user's recent diary entries and mood trends: ${JSON.stringify(history || [])}
      
  Generate a short, calming piece of advice on how the user can lower their stress and maintain mental stability today.
  
  RULES:
  - Be empathetic and grounded.
  - Suggest one or two actionable, simple techniques (like breathing, grounding, walking).
  - Keep it under 60 words.
  - Format as a natural paragraph without bullet points or headers.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a calming, professional mental wellness guide.",
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Stress error:", error);
      if (error.message === "API_KEY_MISSING") {
        return res.status(500).json({ error: "Please configure your Gemini API Key in the Secrets panel." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
