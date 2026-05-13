import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { GLOBAL_GUIDE, buildOutputContractTail } from "./output-contract";

export type DesignSystem = "flat" | "liquid";

const DESIGN_MD_PATH: Record<DesignSystem, string> = {
  flat: path.join(process.cwd(), "src/lib/prompt/design-flat.md"),
  liquid: path.join(process.cwd(), "src/lib/prompt/design-liquid.md"),
};

const designMdCache: Partial<Record<DesignSystem, string>> = {};

async function loadDesignMd(designSystem: DesignSystem): Promise<string> {
  if (designMdCache[designSystem]) return designMdCache[designSystem]!;
  const body = await fs.readFile(DESIGN_MD_PATH[designSystem], "utf8");
  designMdCache[designSystem] = body;
  return body;
}

export type SystemBlock = {
  type: "text";
  text: string;
  cache_control: { type: "ephemeral" };
};

export async function buildSystemBlocks(designSystem: DesignSystem): Promise<SystemBlock[]> {
  const designMd = await loadDesignMd(designSystem);
  return [
    { type: "text", text: GLOBAL_GUIDE, cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: designMd + buildOutputContractTail(designSystem),
      cache_control: { type: "ephemeral" },
    },
  ];
}
