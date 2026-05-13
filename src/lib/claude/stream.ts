import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedAttachment } from "../attachments";
import { buildSystemBlocks, type DesignSystem } from "../prompt/buildSystemPrompt";

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
export const MAX_OUTPUT_TOKENS = 8192;

export type StreamEvent =
  | { type: "phase"; phase: "thinking" | "writing" }
  | { type: "text_delta"; text: string }
  | { type: "done"; tokensIn: number; tokensOut: number; cacheRead: number; finishReason: string };

function clientInstance() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY が環境変数に設定されていません");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function buildUserContent(att: ExtractedAttachment): Anthropic.Messages.ContentBlockParam[] {
  const intro =
    `以下の資料（${att.filename}）からコンテンツを読み取り、` +
    `instyle.group デザインシステムに沿った一枚の HTML として再構成してください。`;

  switch (att.kind) {
    case "pdf":
      return [
        { type: "text", text: intro },
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: att.pdfBase64 },
        },
      ];
    case "image":
      return [
        { type: "text", text: intro + "\n（画像から文字・図表を読み取り、内容を構造化してください）" },
        {
          type: "image",
          source: { type: "base64", media_type: att.mediaType, data: att.base64 },
        },
      ];
    case "html":
      return [
        {
          type: "text",
          text:
            intro +
            "\n以下は参考用の HTML 文字列です。マークアップ構造は無視し、**テキスト内容だけを拾って**再構成してください。\n\n```html\n" +
            att.text +
            "\n```",
        },
      ];
    case "docx":
    case "pptx":
    case "text":
      return [
        {
          type: "text",
          text: intro + "\n以下が抽出されたテキストです。\n\n```\n" + att.text + "\n```",
        },
      ];
  }
}

export async function* streamRedesign(args: {
  attachment: ExtractedAttachment;
  designSystem: DesignSystem;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent, void, void> {
  const { attachment, designSystem, signal } = args;
  const client = clientInstance();
  const system = await buildSystemBlocks(designSystem);
  const userContent = buildUserContent(attachment);

  yield { type: "phase", phase: "thinking" };

  const stream = client.messages.stream(
    {
      model: DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system,
      messages: [{ role: "user", content: userContent }],
    },
    { signal },
  );

  let writingAnnounced = false;

  for await (const evt of stream) {
    if (evt.type === "content_block_delta" && evt.delta.type === "text_delta") {
      if (!writingAnnounced) {
        writingAnnounced = true;
        yield { type: "phase", phase: "writing" };
      }
      yield { type: "text_delta", text: evt.delta.text };
    }
  }

  const final = await stream.finalMessage();
  const usage = final.usage;
  yield {
    type: "done",
    tokensIn: usage.input_tokens ?? 0,
    tokensOut: usage.output_tokens ?? 0,
    cacheRead: usage.cache_read_input_tokens ?? 0,
    finishReason: final.stop_reason ?? "end_turn",
  };
}
