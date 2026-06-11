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
  tryOpenRouter("google/gemini-2.0-flash-exp:free").then(r => console.log("gemini", r)).catch(console.error),
  tryOpenRouter("google/gemini-1.5-pro:free").then(r => console.log("1.5", r)).catch(console.error),
  tryOpenRouter("huggingfaceh4/zephyr-7b-beta:free").then(r => console.log("zephyr", r)).catch(console.error),
]);
