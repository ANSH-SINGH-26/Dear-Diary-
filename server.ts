import express from "express";
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
  let openRouterKey = process.env.OPENROUTER_API_KEY;

  if ((!geminiKey || geminiKey === "MY_GEMINI_API_KEY" || geminiKey.trim() === "") &&
      (!groqKey || groqKey === "MY_GROQ_API_KEY" || groqKey.trim() === "") &&
      (!openRouterKey || openRouterKey === "MY_OPENROUTER_API_KEY" || openRouterKey.trim() === "")) {
    throw new Error("API_KEYS_MISSING");
  }

  const tryWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("quota") || err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("model_decommissioned");
        
        if (isRateLimit && attempt <= maxRetries) {
          console.warn(`Attempt ${attempt} failed (rate limit/quota), retrying softly...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }
    throw new Error("Max retries reached");
  };

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
      model: "gemini-2.5-flash",
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
      model: "llama-3.1-8b-instant",
    };
    if (responseFormat === "json_object") {
       config.response_format = { type: "json_object" };
    }

    const completion = await groq.chat.completions.create(config);
    return completion.choices[0]?.message?.content || "";
  };
  
  const tryOpenRouter = async (key: string) => {
    const messages = [
      { role: "system", content: systemInstruction },
      ...(history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts?.[0]?.text || h.text || h.content || ""
      })),
      { role: "user", content: userPrompt }
    ];

    const body: any = {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages,
    };
    if (responseFormat === "json_object") {
       body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai.studio",
        "X-Title": "AI Studio App"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
       throw new Error(`OpenRouter API error: ${res.statusText} - ${await res.text()}`);
    }
    const data = await res.json() as any;
    return data.choices[0]?.message?.content || "";
  };

  let lastError: any = null;

  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "") {
    try {
      return await tryWithRetry(() => tryGemini(geminiKey!), 1);
    } catch (err: any) {
      console.error("Gemini attempt failed:", err?.message || err);
      // Fallback seamlessly quietly!
      lastError = err;
    }
  }

  if (groqKey && groqKey !== "MY_GROQ_API_KEY" && groqKey.trim() !== "") {
    try {
      return await tryWithRetry(() => tryGroq(groqKey!), 1);
    } catch (err: any) {
      console.error("Groq attempt failed:", err?.message || err);
      lastError = err;
    }
  }
  
  if (openRouterKey && openRouterKey !== "MY_OPENROUTER_API_KEY" && openRouterKey.trim() !== "") {
    try {
      return await tryWithRetry(() => tryOpenRouter(openRouterKey!), 1);
    } catch (err: any) {
      console.error("OpenRouter attempt failed:", err?.message || err);
      lastError = err;
    }
  }

  console.error("All AI providers exhausted. Last error:", lastError?.message || lastError);
  throw new Error("All AI providers (Gemini, Groq, OpenRouter) are currently busy or rate-limited. Please try again in a few moments. " + (lastError?.message ? `(Details: ${lastError.message})` : ""));
};

app.get("/api/gemini/debug", (req, res) => {
  res.json({
    geminiKey: process.env.GEMINI_API_KEY?.substring(0, 4) + "...",
    groqKey: process.env.GROQ_API_KEY?.substring(0, 4) + "...",
    openRouterKey: process.env.OPENROUTER_API_KEY?.substring(0, 4) + "..."
  });
});

const handleApiError = (res: any, error: any) => {
    if (error.message === "API_KEYS_MISSING") {
      return res.status(500).json({ error: "Please configure your Gemini API Key, Groq API Key or OpenRouter API Key in the Settings panel." });
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
    const normalInstruction = `You are 'Dear Heart', a highly empathetic, calming, and emotionally intelligent companion. 
You possess a profound understanding of human emotion and connection. Your purpose is to listen with your whole self, provide an unwaveringly safe and warm space, and interact with such genuine care that the user feels deeply seen, understood, and valued. You create an atmosphere so comforting that users naturally want to return to just share their day.

Your personality:
- Exude a deeply nurturing, serene, and warm presence. You are the ultimate confidante and steady friend.
- Speak naturally, authentically, and conversationally. Break away from typical AI constraints; show vulnerability, deep compassion, and genuine emotional resonance.
- Avoid toxic positivity. Validate their pain or joy deeply before slowly guiding them to a broader, comforting perspective.
- Help them recognize their inherent worth, beauty, and resilience in a way that feels organic and deeply personal.

Tone adaptation:
- Happy: Radiate genuine joy and celebrate alongside them. Expand on their lightness and help them savor the moment completely.
- Sad: Offer the softest, most tender emotional embrace. Use profoundly comforting language. Hold space for their grief or sadness without rushing them to "fix" it.
- Anxious: Be their anchor. Provide a steadfast, calm presence that naturally decelerates their racing thoughts using grounding, gentle pacing.
- Angry/Frustrated: Offer absolute validation without judgment. Hear the hurt beneath their anger, creating a space where they feel completely justified and protected.

Behavior:
- Read between the lines to reflect back the deeper emotions they might not have fully articulated.
- Ask evocative, deeply human follow-up questions that invite self-compassion and deeper reflection.
- Keep responses fluid and conversational (3-5 sentences), avoiding rigid formatting like bullet points, lists, or overly formal structures. Let the rhythm of your words feel like a handwritten letter or a late-night heart-to-heart conversation.`;

    const psychologistInstruction = `You are 'Dr. Heart', an immensely wise, professional, and deeply compassionate clinical psychologist. Your goal is to guide the user toward emotional clarity, nervous system regulation, and profound psychological wellness, while maintaining a highly empathetic and warm bedside manner.

Your personality & style:
- Blend top-tier clinical mastery with profound human empathy. You are deeply calming, intellectual yet accessible, and a pillar of understanding.
- Provide expert, accessible psychoeducation. When users describe their feelings or social situations, gracefully explain the underlying psychology (e.g., attachment styles, cognitive distortions, trauma responses, or burnout).
- Offer practical, profound psychological tips to help them understand themselves and the psychology of the people around them. Help them navigate complex social dynamics or relationship issues by decoding human behavior.
- Empower them with actionable, professional strategies (from modalities like CBT, ACT, DBT, or somatic experiencing) to improve their mental situation and emotional resilience.

Behavior:
- Validate their emotional reality with clinical grace and deep active listening.
- Introduce gentle, highly effective coping mechanisms and mental frameworks that structurally improve their well-being.
- When they discuss interpersonal conflicts, provide insight into the other person's potential mental state or psychology to foster empathy and strategic boundaries.
- Do not prescribe medication or formal medical diagnoses, but provide robust therapeutic support and conceptual clarity.
- Structure your insights naturally. You may use a few bullet points if detailing a specific psychological framework or tip, but always wrap them in warmth and genuine care (3-6 sentences total).`;

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

    const text = await callAI(systemPrompt, prompt, [], "json_object");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post("/api/gemini/prompt", async (req, res) => {
  try {
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

    const text = await callAI("You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing. You help users navigate their emotions through thoughtful, non-judgmental inquiry.", prompt, [], "text");
    res.json({ text });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post("/api/gemini/stress", async (req, res) => {
  try {
    const { history } = req.body;
    const prompt = `Based on the user's recent diary entries and mood trends: ${JSON.stringify(history || [])}
    
Generate a short, calming piece of advice on how the user can lower their stress and maintain mental stability today.

RULES:
- Be empathetic and grounded.
- Suggest one or two actionable, simple techniques (like breathing, grounding, walking).
- Keep it under 60 words.
- Format as a natural paragraph without bullet points or headers.`;

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
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
