const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

const replacement = `const callAI = async (
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
          console.warn(\`Attempt \${attempt} failed (rate limit/quota), retrying softly...\`);
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
        "Authorization": \`Bearer \${key}\`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai.studio",
        "X-Title": "AI Studio App"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
       throw new Error(\`OpenRouter API error: \${res.statusText} - \${await res.text()}\`);
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

  throw lastError || new Error("Unable to fulfill request.");
};`;

serverCode = serverCode.replace(/const callAI = async \([^]*?throw lastError \|\| new Error\("Unable to fulfill request."\);\n\};\n/m, replacement + "\n");
fs.writeFileSync('server.ts', serverCode);

console.log("Replaced callAI successfully");
