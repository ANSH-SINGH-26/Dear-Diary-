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
  tryOpenRouter("nousresearch/hermes-3-llama-3.1-405b:free").then(r => console.log("hermes", r)).catch(console.error),
  tryOpenRouter("qwen/qwen-2-72b-instruct:free").then(r => console.log("qwen", r)).catch(console.error),
]);
