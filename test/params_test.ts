import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Params, parseArgs } from "../lib/params.ts";

Deno.test("parseArgs", () => {
  const testCases: [string[], Params][] = [
    [
      ["--version"],
      {
        version: true,
        help: false,
        noChat: false,
        debug: false,
        model: "gpt-4o-mini",
        temperature: 1.0,
        maxTokens: 1000,
        url: undefined,
        systemPrompt: undefined,
        content: undefined,
      },
    ],
    [
      ["--help"],
      {
        version: false,
        help: true,
        noChat: false,
        debug: false,
        model: "gpt-4o-mini",
        temperature: 1.0,
        maxTokens: 1000,
        url: undefined,
        systemPrompt: undefined,
        content: undefined,
      },
    ],
    [
      [
        // no chat flag
        "-n",
        // debug flag
        "-d",
        // model
        "-m",
        "gpt-4",
        // temperature
        "-t",
        "0.5",
        // max token
        "-x",
        "500",
        // Ollama url
        "-u",
        "https://example.com",
        // システムプロンプト
        "-s",
        "You are a helpful AI assistant.",
        // 残りの引数はスペースでjoinされて最初のユーザープロンプトに使用される
        "Hello",
        "world!",
      ],
      {
        version: false,
        help: false,
        noChat: true,
        debug: true,
        model: "gpt-4",
        temperature: 0.5,
        maxTokens: 500,
        url: "https://example.com",
        systemPrompt: "You are a helpful AI assistant.",
        content: "Hello world!",
      },
    ],
  ];

  for (const [args, expected] of testCases) {
    Deno.args.splice(0, Deno.args.length, ...args); // Deno.argsをテストケースの引数で上書き
    const actual = parseArgs();
    assertEquals(actual, expected);
  }
});
