import { parse } from "https://deno.land/std/flags/mod.ts";

// Platformオプションとは
// llamaモデルは共通のオープンモデルなので、
// どこで実行するかをオプションで決める必要がある
export const platformList = ["ollama", "groq", "replicate"] as const;
type Platform = (typeof platformList)[number];

/** Platform型であることを保証する */
function isPlatform(value: string): value is Platform {
  return platformList.includes(value as Platform);
}

export type Params = {
  version: boolean;
  help: boolean;
  noChat: boolean;
  debug: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  url?: string;
  platform?: Platform;
  systemPrompt?: string;
  content?: string;
};

/** Parse console argument */
export function parseArgs(): Params {
  const args = parse(Deno.args, {
    boolean: [
      "v",
      "version",
      "h",
      "help",
      "n",
      "no-chat",
      "d",
      "debug",
    ],
    string: [
      "m",
      "model",
      "u",
      "url",
      "s",
      "system-prompt",
      "content",
      "t",
      "temperature",
      "x",
      "max-tokens",
      "p",
      "platform",
    ],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
    },
  });

  // platform の値を検証
  const platform = args.p || args.platform;
  if (platform !== undefined && !isPlatform(platform)) {
    throw new Error(`Platform must be one of: ${platformList.join(", ")}`);
  }

  return {
    // boolean option
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    noChat: args.n || args["no-chat"] || false,
    debug: args.d || args.debug || false,
    // string option
    model: args.m || args.model || "gpt-4o-mini",
    maxTokens: parseInt(String(args.x || args["max-tokens"])),
    temperature: parseFloat(String(args.t || args.temperature)),
    url: args.u || args.url || undefined,
    platform: platform as Platform | undefined,
    systemPrompt: args.s || args["system-prompt"] || undefined,
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
}
