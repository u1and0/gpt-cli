import { parse } from "https://deno.land/std/flags/mod.ts";
export type Params = {
  version: boolean;
  help: boolean;
  noConversation: boolean;
  debug: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  url?: string;
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
      "no-conversation",
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
    ],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
    },
  });
  return {
    // boolean option
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    noConversation: args.n || args["no-conversation"] || false,
    debug: args.d || args.debug || false,
    // string option
    model: args.m || args.model || "gpt-4o-mini",
    maxTokens: parseInt(String(args.x || args["max-tokens"])),
    temperature: parseFloat(String(args.t || args.temperature)),
    url: args.u || args.url || undefined,
    systemPrompt: args.s || args["system-prompt"] || undefined,
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
}
