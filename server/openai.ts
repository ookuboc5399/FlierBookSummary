import OpenAI from "openai";
import type { CreateBookInput } from "../client/src/types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummaryAudio(text: string): Promise<string> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  // In a real application, you would upload this to a storage service
  // For this example, we'll return a data URL
  return `data:audio/mp3;base64,${buffer.toString("base64")}`;
}

export async function processBookSummary(input: CreateBookInput) {
  // First, let's enhance the summary using GPT-4
  const summaryResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert at summarizing books for business professionals. Enhance the following summary to be more engaging and insightful while maintaining its core message. Keep the length similar.",
      },
      {
        role: "user",
        content: input.summary,
      },
    ],
  });

  const enhancedSummary = summaryResponse.choices[0].message.content;
  if (!enhancedSummary) throw new Error("Failed to generate summary");

  // Then, generate audio for the enhanced summary
  const audioUrl = await generateSummaryAudio(enhancedSummary);

  return {
    content: enhancedSummary,
    audioUrl,
  };
}
