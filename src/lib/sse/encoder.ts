const enc = new TextEncoder();

export type SSEEvent =
  | { event: "progress"; data: { phase: "reading" | "thinking" | "writing"; detail?: string } }
  | { event: "html_delta"; data: { chunk: string } }
  | { event: "done"; data: { htmlLength: number; tokensIn: number; tokensOut: number; cacheRead?: number; finishReason: string } }
  | { event: "error"; data: { code: string; message: string; retriable?: boolean } };

export function frame(ev: SSEEvent): Uint8Array {
  const lines = `event: ${ev.event}\ndata: ${JSON.stringify(ev.data)}\n\n`;
  return enc.encode(lines);
}

export function comment(text: string): Uint8Array {
  return enc.encode(`: ${text}\n\n`);
}
