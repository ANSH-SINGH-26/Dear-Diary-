import dotenv from "dotenv";
dotenv.config();

const tryOpenRouter = async (modelName: string) => {
    const messages = [
      { role: "system", content: "hello" },
      { role: "user", content: "test" }
    ];

    const body: any = {
      model: modelName,
      messages,
    };

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
       throw new Error(`OpenRouter (${modelName}) error: ${res.statusText} - ${await res.text()}`);
    }
    const data = await res.json() as any;
    if (data.error) throw new Error(data.error.message);
    return data.choices[0]?.message?.content || "";
  };

Promise.allSettled([
  tryOpenRouter("google/gemini-2.5-flash:free").then(console.log).catch(console.error),
  tryOpenRouter("google/gemini-2.0-flash-lite-preview-02-05:free").then(console.log).catch(console.error),
  tryOpenRouter("meta-llama/llama-3.3-70b-instruct:free").then(console.log).catch(console.error),
]);
