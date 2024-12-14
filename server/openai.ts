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
        content: `あなたはビジネス書の要約のスペシャリストです。以下の本の要約を、以下のガイドラインに従って改善してください：

1. ビジネスパーソンにとって実用的で価値のある内容に焦点を当てる
2. 本の主要なポイントを明確に説明する
3. 実践的なアドバイスや具体例を含める
4. 専門用語は必要最小限に抑え、分かりやすい言葉で説明する
5. 結論や実践のためのステップを含める

元の要約の長さは保持しつつ、より魅力的で洞察に富んだ内容にしてください。`,
      },
      {
        role: "user",
        content: input.summary,
      },
    ],
  });

  const enhancedSummary = summaryResponse.choices[0].message.content;
  if (!enhancedSummary) throw new Error("要約の生成に失敗しました");

  // Then, generate audio for the enhanced summary
  const audioUrl = await generateSummaryAudio(enhancedSummary);

  return {
    content: enhancedSummary,
    audioUrl,
  };
}
