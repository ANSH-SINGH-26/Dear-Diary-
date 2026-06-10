const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

// Replace Chat
serverContent = serverContent.replace(
  /const chat = ai\.chats\.create\(\{[\s\S]*?res\.json\(\{ text: result\.text \}\);/m,
  `const messages = [
      { role: "system", content: mode === 'psychologist' ? psychologistInstruction : normalInstruction },
      ...(history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.parts?.[0]?.text || h.text || ""
      })),
      { role: "user", content: message }
    ] as any[];

    const completion = await ai.chat.completions.create({
      messages,
      model: "llama3-8b-8192",
    });

    res.json({ text: completion.choices[0]?.message?.content || "" });`
);

// Replace Analyze
serverContent = serverContent.replace(
  /const response = await ai\.models\.generateContent\(\{[\s\S]*?res\.json\(\{ text: response\.text \}\);/m,
  `const completion = await ai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    if (!text) throw new Error("No response");
    res.json({ text });`
);

// Replace Prompt
serverContent = serverContent.replace(
  /const response = await ai\.models\.generateContent\(\{\s+model: "gemini-2\.0-flash",\s+contents: prompt,\s+config: \{\s+systemInstruction: "You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing\. You help users navigate their emotions through thoughtful, non-judgmental inquiry\.",\s+\},\s+\}\);\s+res\.json\(\{ text: response\.text \}\);/m,
  `const completion = await ai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing. You help users navigate their emotions through thoughtful, non-judgmental inquiry." },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
    });

    res.json({ text: completion.choices[0]?.message?.content || "" });`
);

// Replace Stress
serverContent = serverContent.replace(
  /const response = await ai\.models\.generateContent\(\{\s+model: "gemini-2\.0-flash",\s+contents: prompt,\s+config: \{\s+systemInstruction: "You are a calming, professional mental wellness guide\.",\s+\},\s+\}\);\s+res\.json\(\{ text: response\.text \}\);/m,
  `const completion = await ai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a calming, professional mental wellness guide." },
        { role: "user", content: prompt }
      ],
      model: "llama3-8b-8192",
    });

    res.json({ text: completion.choices[0]?.message?.content || "" });`
);

fs.writeFileSync('server.ts', serverContent);
