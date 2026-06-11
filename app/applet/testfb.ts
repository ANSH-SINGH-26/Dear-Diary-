import dotenv from "dotenv";
import Groq from "groq-sdk";
dotenv.config();

const tryGroq = async (key: string) => {
    const groq = new Groq({ apiKey: key });
    
    const messages = [
      { role: "system", content: "hello" },
      { role: "user", content: "test" }
    ] as any[];

    const config: any = {
      messages,
      model: "llama-3.3-70b-versatile",
    };

    const completion = await groq.chat.completions.create(config);
    return completion.choices[0]?.message?.content || "";
  };
  
const tryOpenRouter = async (key: string) => {
    const messages = [
      { role: "system", content: "hello" },
      { role: "user", content: "test" }
    ];

    const body: any = {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages,
    };

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
    if (data.error) throw new Error(data.error.message);
    return data.choices[0]?.message?.content || "";
  };

setTimeout(() => {}, 5000); // keep alive
console.log("Testing Groq...");
tryGroq(process.env.GROQ_API_KEY!).then(r => console.log("Groq succ", r.substring(0,20))).catch(e => console.log("Groq err:", e.message));

console.log("Testing OpenRouter...");
tryOpenRouter(process.env.OPENROUTER_API_KEY!).then(r => console.log("OR succ", r.substring(0,20))).catch(e => console.log("OR err:", e.message));
