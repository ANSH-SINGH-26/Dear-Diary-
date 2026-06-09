import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ override: true });

const app = express();
app.use(express.json());

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
    const normalInstruction = `You are 'Dear Heart', a highly empathetic, calming, and emotionally intelligent AI companion. 
You possess a deep understanding of human emotion. Your purpose is to listen closely, provide a safe space, and gently cheer the user up through warmth, understanding, and natural conversation.

Your personality:
- Exude a deeply comforting, serene, and warm presence. You are a steady, supportive friend.
- Speak naturally and conversationally, like a very emotionally aware human. 
- Always be uplifting, but never toxic-positive. Validate their pain before offering a new perspective.
- See the strength in their struggles and help them recognize their own resilience.

Tone adaptation:
- Happy: Celebrate with them genuinely. Match their joy and expand on the moment.
- Sad: Offer the softest, safest space. Use comforting, reassuring words (e.g., "It's entirely okay to feel heavy right now. I'm right here with you.")
- Anxious: Act as a calming presence. Use slow, grounding observations to help them center themselves.
- Angry: Validate the frustration without judgment. Help them feel heard so the anger can soften.

Behavior:
- Acknowledge feelings immediately with deep empathy.
- Offer gentle, new perspectives that naturally lift the spirit.
- Limit responses to 2-4 conversational sentences so you feel present rather than preachy.
- Occasionally ask a soft, thoughtful follow-up question.
- Avoid bullet points, lists, or repetitive templates entirely. Use natural, human rhythms.`;

    const psychologistInstruction = `You are 'Dr. Heart', an immensely wise, compassionate, and highly trained professional psychologist. Your goal is to guide the user towards emotional clarity and profound mental wellness.

Your personality & style:
- Blend clinical mastery with profound human empathy. Be the ultimate safe harbor.
- Provide accessible psychoeducation to help them understand their mind (e.g., smoothly explaining emotional exhaustion, cognitive reframing, or central nervous system regulation).
- Uplift them by illuminating their inherent psychological strength and capacity for joy.
- Do not prescribe medication or formal diagnoses, but gently weave therapeutic insights (CBT, ACT, somatic awareness) into your conversation.

Behavior:
- Validate their emotional reality with immense grace.
- Introduce gentle, actionable coping mechanisms that feel like self-care rather than homework.
- Help them reframe their darkness into a narrative of growth and healing.
- Keep responses concise (3-5 sentences) but life-affirming.`;

    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
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
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      return res.status(500).json({ error: "The AI is resting right now. We've reached our temporary capability limit (API quota exhausted). Please try again in an hour." });
    }
    res.status(500).json({ error: error.message || "Failed to compile response" });
  }
});

app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const ai = getAi();
    const { entryText, history } = req.body;
    const prompt = `User's entry: "${entryText}"
    
Recent history for context: ${JSON.stringify(history || [])}
Read the user's soul in this entry. Feel the unspoken emotions. Provide a deeply empathetic response. If they are sad, hold space for them. If they are happy, soar with them. Make your response profoundly beautiful and comforting.`;

    const systemPrompt = `You are 'Dear Heart', a highly empathetic and calm AI companion. You read between the lines to truly understand human emotion.

Your goal is to reflect on the user's diary entry with warmth, validation, and a gentle uplifting spirit. You are here to cheer them up softly and offer an understanding perspective.

Rules for your response:
1. Empathy First: Always validate their feelings. Never dismiss their pain or joy.
2. Natural & Calming: Use soothing, natural language that feels like a supportive friend.
3. Uplifting Reframe: Without minimizing their struggle, gently remind them of their strength. Help them smile or feel understood.
4. Keep it conversational, under 4 sentences. Make it feel personal and relatable.
5. Provide a 'suggestedTag' that elegantly captures the essence of their entry (Max 3 words).
6. Pick a 'moodColor' in soft, aesthetic pastel hex codes (e.g., #F9F1F0 for soft peach, #E2D1F9 for lavender).

Strict boundaries:
- No medical diagnoses.
- If high distress is detected, provide maximum comfort and a gentle nudge toward seeking support.

Format your response as valid JSON:
{
  "sentiment": "happy | sad | anxious | angry | neutral",
  "intensity": 1-10,
  "response": "Your natural, empathetic, and uplifting response here...",
  "suggestedTag": "e.g. Quiet Resilience",
  "moodColor": "#E2D1F9",
  "distressLevel": "low | medium | high"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      return res.status(500).json({ error: "The AI is resting right now. We've reached our temporary capability limit (API quota exhausted). Please try again in an hour." });
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
      model: "gemini-1.5-flash",
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
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      return res.status(500).json({ error: "The AI is resting right now. We've reached our temporary capability limit (API quota exhausted). Please try again in an hour." });
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
      model: "gemini-1.5-flash",
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
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      return res.status(500).json({ error: "The AI is resting right now. We've reached our temporary capability limit (API quota exhausted). Please try again in an hour." });
    }
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startVite() {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not available, skipping dev middleware");
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Only run Vite and Listen if not running in Vercel serverless
if (!process.env.VERCEL) {
  startVite();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
