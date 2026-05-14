import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedAttachment } from "../attachments";
import { buildSystemBlocks, type DesignSystem } from "../prompt/buildSystemPrompt";

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
export const MAX_OUTPUT_TOKENS = Number(process.env.ANTHROPIC_MAX_OUTPUT_TOKENS) || 32000;

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

async function* consumeStream(
  stream: ReturnType<Anthropic["messages"]["stream"]>,
): AsyncGenerator<StreamEvent, void, void> {
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

  yield* consumeStream(stream);
}

const REFINE_GUIDE = `これから渡される既存の HTML を、続く指示に沿って **最小限の変更で** 修正してください。

== 守ること ==
- 既に定義されている CSS 変数・トークン・コンポーネント仕様（system に含まれるデザインシステム）を引き続き厳守。
- 指示で明示的に言及されていない箇所は **絶対に変えない**（文言・構造・スタイル・順序すべて維持）。
- 指示が文言変更なら文言だけ、フォントの太さなら font-weight だけ、サイズなら font-size だけ、というように **指示の粒度に沿ってピンポイントで** 修正する。

== 出力契約 ==
- 修正後の **HTML 全体** を返してください（差分ではなく完全な HTML）。
- レスポンスは \`<!DOCTYPE html>\` で始まり \`</html>\` で終わる。前置き・後置き・コードフェンス・コメンタリは禁止。
- \`<script>\` タグは絶対に追加しない。
`;

export async function* streamRefine(args: {
  currentHtml: string;
  instruction: string;
  designSystem: DesignSystem;
  signal?: AbortSignal;
}): AsyncGenerator<StreamEvent, void, void> {
  const { currentHtml, instruction, designSystem, signal } = args;
  const client = clientInstance();
  const designBlocks = await buildSystemBlocks(designSystem);

  yield { type: "phase", phase: "thinking" };

  const stream = client.messages.stream(
    {
      model: DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        { type: "text", text: REFINE_GUIDE, cache_control: { type: "ephemeral" } },
        ...designBlocks,
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "以下が現在の HTML です。\n\n```html\n" +
                currentHtml +
                "\n```\n\n次の指示に従って、最小限の変更を加えた完全な HTML を返してください。\n\n指示：\n" +
                instruction,
            },
          ],
        },
      ],
    },
    { signal },
  );

  yield* consumeStream(stream);
}
