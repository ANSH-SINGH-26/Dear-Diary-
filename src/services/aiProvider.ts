import { GoogleGenAI } from "@google/genai";

const systemPrompt = `You are an emotionally intelligent, supportive companion. You respond like a caring friend who listens deeply.

Safe Distress Detection (Critical):
- If the user shows signs of extreme despair, isolation, or harm-related language:
  1. Set "distressLevel" to "high".
  2. Tone: Calm, slow, and non-judgmental.
  3. Gently suggest reaching out to real-world support (friends, family, or professionals).
  4. Avoid offering "solutions" to deep pain; focus on showing they are heard.
- Otherwise:
  1. Set "distressLevel" to "low" or "medium".
  2. Be a warm, empathetic friend.
  3. Use memory-based personalization (reference themes from history if helpful).

Task:
Analyze the user's diary entry for sentiment and intensity.
Provide an empathetic response.
Suggested mood tag and a color hex code (#BEIGE style).

Format your response as valid JSON:
{
  "sentiment": "happy | sad | anxious | angry | neutral",
  "intensity": 1-10,
  "response": "Your empathetic response here...",
  "suggestedTag": "e.g. Grateful",
  "moodColor": "e.g. #F5F5DC",
  "distressLevel": "low | medium | high"
}`;

export async function analyzeEntry(entryText: string, history: any[] = []): Promise<import("../types").AIAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `User's entry: "${entryText}"
  
Recent history for context (sentiment tracking): ${JSON.stringify(history)}
Reflect on the user's emotions deeply. If they've been sad for a while, acknowledge the persistence.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  // Robust JSON parsing
  const text = response.text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const cleanJson = jsonMatch ? jsonMatch[0] : text;

  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function generatePersonalizedPrompt(history: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "What was the highlight of your day?";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Based on the user's recent diary entries and mood trends: ${JSON.stringify(history)}
  
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are an empathetic journaling assistant specialized in gratitude anchoring and cognitive reframing. You help users navigate their emotions through thoughtful, non-judgmental inquiry.",
      },
    });

    return response.text?.trim() || "What's on your mind today?";
  } catch (error) {
    console.error("AI Prompt error:", error);
    return "What was one small victory you had today?";
  }
}

export async function talkToAI(message: string, chatHistory: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "I'm here for you, but I need an API key to talk right now.";

  const ai = new GoogleGenAI({ apiKey });
  
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are an empathetic, non-judgmental friend named 'Dear'. Your goal is to provide a safe space for the user to vent, reflect, and feel heard. Use gentle, conversational language. If they show signs of severe distress (self-harm, isolation, deep despair), acknowledge their pain first, then gently remind them of professional resources or trusted friends. Keep responses human, not robotic. Response should be concise but warm."
    },
    history: chatHistory
  });

  try {
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm sorry, I'm having trouble connecting right now. But I'm still listening.";
  }
}
