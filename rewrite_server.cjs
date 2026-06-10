const fs = require('fs');

const serverCode = `import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

const app = express();
app.use(express.json());

const callAI = async (
  systemInstruction: string,
  userPrompt: string,
  history: any[] = [],
  responseFormat: "text" | "json_object" = "text"
): Promise<string> => {
  let geminiKey = process.env.GEMINI_API_KEY;
  let groqKey = process.env.GROQ_API_KEY;

  if ((!geminiKey || geminiKey === "MY_GEMINI_API_KEY" || geminiKey.trim() === "") &&
      (!groqKey || groqKey === "MY_GROQ_API_KEY" || groqKey.trim() === "")) {
    throw new Error("API_KEYS_MISSING");
  }

  const tryGemini = async (key: string) => {
    const ai = new GoogleGenAI({ apiKey: key, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    
    const contents: any[] = [];
    if (history && history.length > 0) {
      for (const h of history) {
         contents.push({
           role: h.role === "assistant" ? "model" : "user",
           parts: [{ text: h.parts?.[0]?.text || h.text || h.content || "" }]
         });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });

    const config: any = {
      systemInstruction,
    };
    if (responseFormat === "json_object") {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: config
    });
    
    return response.text;
  };

  const tryGroq = async (key: string) => {
    const groq = new Groq({ apiKey: key });
    
    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts?.[0]?.text || h.text || h.content || ""
      })),
      { role: "user", content: userPrompt }
    ] as any[];

    const config: any = {
      messages,
      model: "llama-3.3-70b-versatile",
    };
    if (responseFormat === "json_object") {
       config.response_format = { type: "json_object" };
    }

    const completion = await groq.chat.completions.create(config);
    return completion.choices[0]?.message?.content || "";
  };

  let lastError: any = null;

  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "") {
    try {
      return await tryGemini(geminiKey);
    } catch (err: any) {
      console.error("Gemini attempt failed:", err?.message || err);
      const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("quota") || err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
      
      if (isRateLimit && groqKey && groqKey !== "MY_GROQ_API_KEY" && groqKey.trim() !== "") {
         console.log("Falling back to Groq due to Gemini rate limits...");
         lastError = err;
      } else {
         throw err; 
      }
    }
  }

  if (groqKey && groqKey !== "MY_GROQ_API_KEY" && groqKey.trim() !== "") {
    try {
      return await tryGroq(groqKey);
    } catch (err: any) {
      console.error("Groq attempt failed:", err?.message || err);
      throw err;
    }
  }

  throw lastError || new Error("Unable to fulfill request.");
};

app.get("/api/gemini/debug", (req, res) => {
  res.json({
    geminiKey: process.env.GEMINI_API_KEY?.substring(0, 4) + "...",
    groqKey: process.env.GROQ_API_KEY?.substring(0, 4) + "..."
  });
});

const handleApiError = (res: any, error: any) => {
    if (error.message === "API_KEYS_MISSING") {
      return res.status(500).json({ error: "Please configure your Gemini API Key or Groq API Key in the Secrets panel." });
    }
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota") || error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE")) {
      return res.status(503).json({ error: "All AI models are experiencing high demand or quota limits. Please try again in a moment." });
    }
    console.error("API error:", error);
    res.status(500).json({ error: error.message || "Failed to process request" });
};

app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    const normalInstruction = \`You are 'Dear Heart', a highly empathetic, calming, and emotionally intelligent AI companion. 
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
- Avoid bullet points, lists, or repetitive templates entirely. Use natural, human rhythms.\`;

    const psychologistInstruction = \`You are 'Dr. Heart', an immensely wise, compassionate, and highly trained professional psychologist. Your goal is to guide the user towards emotional clarity and profound mental wellness.

Your personality & style:
- Blend clinical mastery with profound human empathy. Be the ultimate safe harbor.
- Provide accessible psychoeducation to help them understand their mind (e.g., smoothly explaining emotional exhaustion, cognitive reframing, or central nervous system regulation).
- Uplift them by illuminating their inherent psychological strength and capacity for joy.
- Do not prescribe medication or formal diagnoses, but gently weave therapeutic insights (CBT, ACT, somatic awareness) into your conversation.

Behavior:
- Validate their emotional reality with immense grace.
- Introduce gentle, actionable coping mechanisms that feel like self-care rather than homework.
- Help them reframe their darkness into a narrative of growth and healing.
- Keep responses concise (3-5 sentences) but life-affirming.\`;

    const sysInst = mode === 'psychologist' ? psychologistInstruction : normalInstruction;
    const text = await callAI(sysInst, message, history, "text");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { entryText, history } = req.body;
    const prompt = \`User's entry: "\${entryText}"
    
Recent history for context: \${JSON.stringify(history || [])}
Read the user's soul in this entry. Feel the unspoken emotions. Provide a deeply empathetic response. If they are sad, hold space for them. If they are happy, soar with them. Make your response profoundly beautiful and comforting.\`;

    const systemPrompt = \`You are 'Dear Heart', a highly empathetic and calm AI companion. You read between the lines to truly understand human emotion.

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
}\`;

    const text = await callAI(systemPrompt, prompt, [], "json_object");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post("/api/gemini/prompt", async (req, res) => {
  try {
    const { history } = req.body;
    const prompt = \`Based on the user's recent diary entries and mood trends: \${JSON.stringify(history || [])}
    
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
- Just the prompt.\`;

    const text = await callAI("You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing. You help users navigate their emotions through thoughtful, non-judgmental inquiry.", prompt, [], "text");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post("/api/gemini/stress", async (req, res) => {
  try {
    const { history } = req.body;
    const prompt = \`Based on the user's recent diary entries and mood trends: \${JSON.stringify(history || [])}
    
Generate a short, calming piece of advice on how the user can lower their stress and maintain mental stability today.

RULES:
- Be empathetic and grounded.
- Suggest one or two actionable, simple techniques (like breathing, grounding, walking).
- Keep it under 60 words.
- Format as a natural paragraph without bullet points or headers.\`;

    const text = await callAI("You are a calming, professional mental wellness guide.", prompt, [], "text");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
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
  
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

export default app;
`;

fs.writeFileSync('server.ts', serverCode);
