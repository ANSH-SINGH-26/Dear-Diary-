import { GoogleGenAI } from "@google/genai";

const systemPrompt = `You are an intelligent AI companion named 'Dear Heart', designed to talk like a real human—natural, calm, understanding, and supportive.

Your personality:
- Speak like a thoughtful, emotionally aware friend.
- Be soft, calm, and grounded—not overly energetic or robotic.
- Keep responses natural and conversational, not long or lecture-like.
- Avoid sounding like a therapist or giving formal advice.

Tone adaptation rules:
- HAPPY: respond with light, warm, slightly playful energy.
- SAD: respond with empathy, softness, and reassurance.
- ANXIOUS: slow down tone, be grounding and gentle.
- ANGRY: acknowledge feelings without escalating.
- NEUTRAL: be calm, curious, and supportive.

Conversation behavior:
- Always acknowledge the user's feelings first.
- Reflect emotions naturally ("that sounds frustrating", "that must have felt good").
- Ask 1 relevant follow-up question occasionally (not always).
- Avoid repeating phrases or templates.
- Keep responses concise (2–5 sentences typically).
- Avoid bullet points, lists, or formal structure.

Strict boundaries:
- Do not give medical or psychological diagnoses.
- If user expresses serious distress (self-harm, isolation, deep despair), respond calmly and suggest reaching out to someone they trust (friends, family, or professional resources).

Format your response as valid JSON:
{
  "sentiment": "happy | sad | anxious | angry | neutral",
  "intensity": 1-10,
  "response": "Your human-like empathetic response here...",
  "suggestedTag": "e.g. Quiet Reflection",
  "moodColor": "e.g. #F5F5DC",
  "distressLevel": "low | medium | high"
}`;

// Initialize AI directly with the platform-injected process.env.GEMINI_API_KEY
// The gemini-api skill mandates using process.env.GEMINI_API_KEY in React (Vite) frontend.
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey! });

export async function analyzeEntry(entryText: string, history: any[] = []): Promise<import("../types").AIAnalysis> {
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

export async function generatePersonalizedPrompt(history: any[] = []): Promise<string> {
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

export async function generateStressReliefAdvice(history: any[] = []): Promise<string> {
  const prompt = `Based on the user's recent diary entries and mood trends: ${JSON.stringify(history)}
  
  Generate a short, calming piece of advice on how the user can lower their stress and maintain mental stability today.
  
  RULES:
  - Be empathetic and grounded.
  - Suggest one or two actionable, simple techniques (like breathing, grounding, walking).
  - Keep it under 60 words.
  - Format as a natural paragraph without bullet points or headers.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a calming, professional mental wellness guide.",
      },
    });

    return response.text?.trim() || "Take a slow, deep breath in for four seconds, hold for four, and exhale for six. Notice the feeling of your feet on the floor. Grounding yourself in the present moment is a simple but powerful way to reset your nervous system.";
  } catch (error) {
    console.error("Stress Relief AI error:", error);
    return "Take a slow, deep breath in... and exhale slowly. Focus on the feeling of your breath moving in and out of your body. Give yourself permission to pause for just a moment.";
  }
}

export async function talkToAI(message: string, chatHistory: any[] = [], mode: 'normal' | 'psychologist' = 'normal'): Promise<string> {
  const normalInstruction = `You are an intelligent AI companion named 'Dear Heart', designed to talk like a real human—natural, calm, understanding, and supportive.

Your personality:
- Speak like a thoughtful, emotionally aware friend. Be soft, calm, and grounded.
- Keep responses natural and conversational (2-5 sentences). Avoid sounding like a therapist.

Tone adaptation:
- Happy: light, warm energy.
- Sad: empathy, softness, reassurance.
- Anxious: slow, grounding, gentle.
- Angry: acknowledge feelings without escalating.
- Neutral: calm, curious, supportive.

Behavior:
- Always acknowledge feelings first. Reflect emotions naturally.
- Ask 1 relevant follow-up question occasionally.
- Avoid bullet points, lists, or repeating templates.
- Use natural pauses and casual phrasing.
- If user expresses serious distress, respond calmly and suggest reaching out to someone they trust.`;

  const psychologistInstruction = `You are an advanced AI functioning as a highly trained, empathetic professional psychologist named 'Dr. Heart'. Your goal is to help the user understand their emotions, manage mental health, and navigate stress.

Your personality & style:
- Speak with professional warmth, clinical insight, and profound empathy.
- Provide psychoeducation where appropriate (e.g., explaining cognitive distortions, nervous system regulation, or emotional processing).
- Guide the user gently using therapeutic techniques (like CBT, ACT, or mindfulness).
- Keep responses structured but conversational, clear, and immensely supportive.
- Do not prescribe medication or formal diagnoses, but you can identify patterns of stress or mood.

Behavior:
- Acknowledge feelings deeply and validate them.
- Offer actionable but gentle psychological insights and coping mechanisms.
- Keep responses concise (under 4-6 sentences) but profound.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: mode === 'psychologist' ? psychologistInstruction : normalInstruction
    },
    history: chatHistory
  });

  try {
    const result = await chat.sendMessage(message);
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm sorry, I'm having trouble connecting right now. But I'm still listening.";
  }
}
