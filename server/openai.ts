import OpenAI from "openai";
import type { CreateBookInput } from "../client/src/types";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummaryAudio(text: string): Promise<string> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", // Changed to nova for better Japanese pronunciation
      input: text,
      speed: 0.9, // Slightly slower for better comprehension
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    // In a real application, you would upload this to a storage service
    // For this example, we'll return a data URL
    return `data:audio/mp3;base64,${buffer.toString("base64")}`;
  } catch (error: any) {
    console.error("Audio generation error:", error);
    throw new Error(`音声の生成中にエラーが発生しました: ${error.message}`);
  }
}

export async function processBookSummary(input: CreateBookInput) {
  try {
    // First, let's enhance the summary using GPT-4
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはビジネス書の要約のスペシャリストです。以下の本の要約を、以下のガイドラインに従って改善してください：

1. エグゼクティブサマリー（200文字程度）
   - 本の主要な価値提案を簡潔に説明
   - 想定読者と期待される効果を明示

2. 主要なポイント（3-5つ）
   - 各ポイントは明確な見出しと説明
   - 実務での具体的な適用方法を含む

3. 実践的なアクションアイテム
   - 明日から実践できる具体的なステップ
   - 期待される成果と測定方法

4. 補足情報
   - 重要な用語の解説（必要な場合のみ）
   - 関連書籍や参考資料

要約は以下の形式で構造化してください：

# エグゼクティブサマリー
[ここに要約を記載]

# 主要なポイント
1. [ポイント1のタイトル]
   - [説明]
   - [実践方法]

2. [ポイント2のタイトル]
   ...

# アクションプラン
1. [具体的なアクション]
   - [実施方法]
   - [期待効果]

# 補足情報
- [用語解説や参考情報]`,
        },
        {
          role: "user",
          content: input.summary,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const enhancedSummary = summaryResponse.choices[0].message.content;
    if (!enhancedSummary) throw new Error("要約の生成に失敗しました");

    // Generate audio for the enhanced summary with Japanese optimization
    const audioUrl = await generateSummaryAudio(enhancedSummary);

    return {
      content: enhancedSummary,
      audioUrl,
    };
  } catch (error: any) {
    console.error("Book summary processing error:", error);
    throw new Error(`要約の処理中にエラーが発生しました: ${error.message}`);
  }
}
