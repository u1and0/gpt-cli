import { parse } from "https://deno.land/std/flags/mod.ts";
import { LLMParam } from "./llm.ts";

export type Params = {
  version: boolean;
  help: boolean;
  noChat: boolean;
  debug: boolean;
  url?: string;
  files?: string[];
  systemPrompt?: string;
  content?: string;
} & LLMParam;

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
    ],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
    },
  });

  // parse()で解釈すると最後に指定したものに上書きされてしまう
  // そのため、getFilePaths()で特別なparseをする
  const files = getFilePaths(Deno.args);

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
    systemPrompt: args.s || args["system-prompt"] || undefined,
    // 残りの引数をすべてスペースで結合
    content: args._.length > 0 ? args._.join(" ") : undefined,
    // string array option
    files: files.length !== 0 ? files : undefined,
  };
}

/** 引数となる配列の中から、
 * すべての-f フラグの次の引数を配列に格納する。
 * @params {string[]} - コマンドライン引数。通常Deno.args
 * @returns {string[]} - ファイルパスの配列
 * @throws - No file specified after -f option
 * @throws - Invalid file path after -f
 */
export function getFilePaths(args: string[]): string[] {
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-f" || args[i] === "--file") {
      // -fの後に引数がない場合はエラー
      if (i + 1 >= args.length) {
        throw new Error("No file specified after -f option");
      }
      // 次の引数が別のオプションの場合はエラー
      if (args[i + 1].startsWith("-")) {
        throw new Error(`Invalid file path after -f: ${args[i + 1]}`);
      }
      files.push(args[i + 1]);
    }
  }
  return files;
}
