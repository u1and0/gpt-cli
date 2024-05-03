import { assertEquals } from "https://deno.land/std@0.184.0/testing/asserts.ts";
import { Params, parseArgs } from "../lib/parse.ts";

Deno.test("parseArgs", () => {
  const testCases: [string[], Params][] = [
    [
      ["--version"],
      {
        version: true,
        help: false,
        noConversation: false,
        model: "gpt-3.5-turbo",
        temperature: 1.0,
        maxTokens: 1000,
        url: "http://localhost:11434",
        systemPrompt: undefined,
        content: undefined,
      },
    ],
    [
      ["--help"],
      {
        version: false,
        help: true,
        noConversation: false,
        model: "gpt-3.5-turbo",
        temperature: 1.0,
        maxTokens: 1000,
        url: "http://localhost:11434",
        systemPrompt: undefined,
        content: undefined,
      },
    ],
    [
      [
        "--no-conversation",
        "-m",
        "gpt-4",
        "-t",
        "0.5",
        "-x",
        "500",
        "-u",
        "https://example.com",
        "-s",
        "You are a helpful AI assistant.",
        "Hello, world!",
      ],
      {
        version: false,
        help: false,
        noConversation: true,
        model: "gpt-4",
        temperature: 0.5,
        maxTokens: 500,
        url: "https://example.com",
        systemPrompt: "You are a helpful AI assistant.",
        content: "Hello, world!",
      },
    ],
  ];

  for (const [args, expected] of testCases) {
    Deno.args.splice(0, Deno.args.length, ...args); // Deno.argsをテストケースの引数で上書き
    const actual = parseArgs();
    assertEquals(actual, expected);
  }
});
