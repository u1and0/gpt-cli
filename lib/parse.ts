import { parse } from "https://deno.land/std/flags/mod.ts";
type Params = {
  version: boolean;
  help: boolean;
  noConversation: boolean;
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
    boolean: ["v", "version", "h", "help", "n", "no-conversation"],
    string: ["m", "model", "u", "url", "s", "system-prompt", "content"],
    number: ["v", "temperature", "x", "max-tokens"],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
      url: "http://localhost:11434",
    },
  });
  const params: Params = {
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    noConversation: args.n || args["no-conversation"] || false,
    model: args.m || args.model || "gpt-3.5-turbo",
    maxTokens: parseInt(String(args.x || args["max-tokens"])),
    temperature: parseFloat(String(args.t || args.temperature)),
    url: args.u || args.url,
    systemPrompt: String(args.s || args["systemPrompt"]),
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
  return params;
}
