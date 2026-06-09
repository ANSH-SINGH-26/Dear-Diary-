// AI Provider - migrated to server-side backend

export async function analyzeEntry(entryText: string, history: any[] = []): Promise<import("../types").AIAnalysis> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entryText, history }),
  });
  if (!response.ok) {
    const errText = await response.text();
    let errMsg = "Network response was not ok";
    try { errMsg = JSON.parse(errText).error || errMsg; } catch(e){}
    throw new Error(errMsg);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error);

  const text = data.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : text;

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function generatePersonalizedPrompt(history: any[] = []): Promise<string> {
  try {
    const response = await fetch('/api/gemini/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    });
    if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Network response was not ok";
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e){}
        throw new Error(errMsg);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.text?.trim() || "What's on your mind today?";
  } catch (error) {
    console.error("AI Prompt error:", error);
    return "What was one small victory you had today?";
  }
}

export async function generateStressReliefAdvice(history: any[] = []): Promise<string> {
  try {
    const response = await fetch('/api/gemini/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
    });
    if (!response.ok) {
        const errText = await response.text();
        let errMsg = "Network response was not ok";
        try { errMsg = JSON.parse(errText).error || errMsg; } catch(e){}
        throw new Error(errMsg);
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.text?.trim() || "Take a slow, deep breath in for four seconds, hold for four, and exhale for six. Notice the feeling of your feet on the floor. Grounding yourself in the present moment is a simple but powerful way to reset your nervous system.";
  } catch (error) {
    console.error("Stress Relief AI error:", error);
    return "Take a slow, deep breath in... and exhale slowly. Focus on the feeling of your breath moving in and out of your body. Give yourself permission to pause for just a moment.";
  }
}

export async function talkToAI(message: string, chatHistory: any[] = [], mode: 'normal' | 'psychologist' = 'normal'): Promise<string> {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: chatHistory, mode }),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Backend server not found. If you deployed to a static host like Vercel, Express routes won't work without configuration.");
      }
      const errText = await response.text();
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.error || 'Network response was not ok');
      } catch (e) {
        throw new Error(`Server error: ${response.status} ${errText}`);
      }
    }
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  } catch (error: any) {
    console.error("Chat error:", error);
    const msg = error?.message || "";
    if (msg.includes("Please configure your Gemini API Key") || msg.includes("API_KEY_MISSING")) {
      return "Hello! I need a Gemini API Key to function. Please open the Settings menu (gear icon or sidebar) in AI Studio, go to Secrets, and add your GEMINI_API_KEY. Once added, I will be able to reply!";
    }
    if (msg.includes("Backend server not found") || msg.includes("Network error") || msg.includes("Failed to fetch")) {
      return "I can't reach the backend server. If you deployed this app, please ensure the backend is running.";
    }
    return `I'm having trouble connecting right now (${msg}).`;
  }
}
