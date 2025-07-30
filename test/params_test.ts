import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { getFilePaths, Params, parseArgs } from "../lib/params.ts";

Deno.test("getFilePaths - should return empty array when no -f options", () => {
  const args = ["program", "arg1", "arg2"];
  const result = getFilePaths(args);
  assertEquals(result, []);
});

Deno.test("getFilePaths - should return file paths when -f options are present", () => {
  const args = ["program", "-f", "file1.txt", "-f", "file2.txt"];
  const result = getFilePaths(args);
  assertEquals(result, ["file1.txt", "file2.txt"]);
});

Deno.test("getFilePaths - should throw error when no file specified after -f", () => {
  const args = ["program", "-f"];
  assertThrows(
    () => getFilePaths(args),
    Error,
    "No file specified after -f option",
  );
});

Deno.test("getFilePaths - should throw error when invalid file path after -f", () => {
  const args = ["program", "-f", "-invalid"];
  assertThrows(
    () => getFilePaths(args),
    Error,
    "Invalid file path after -f: -invalid",
  );
});

Deno.test("getFilePaths - should handle single file with other arguments", () => {
  const args = [
    "program",
    "arg1",
    "arg2",
    "-f",
    "file1.txt",
    "arg3",
  ];
  const result = getFilePaths(args);
  assertEquals(result, ["file1.txt"]);
});

Deno.test("getFilePaths - should handle multiple files with other arguments", () => {
  const args = [
    "program",
    "arg1",
    "-f",
    "file1.txt",
    "arg2",
    "-f",
    "file2.txt",
    "arg3",
  ];
  const result = getFilePaths(args);
  assertEquals(result, ["file1.txt", "file2.txt"]);
});

Deno.test("getFilePaths - should handle -f and --file arguments", () => {
  const args = [
    "program",
    "arg1",
    "--file",
    "file1.txt",
    "arg2",
    "-f",
    "file2.txt",
    "arg3",
  ];
  const result = getFilePaths(args);
  assertEquals(result, ["file1.txt", "file2.txt"]);
});

Deno.test("parseArgs", () => {
  const testCases: [string[], Params][] = [
    [
      ["--version"],
      {
        version: true,
        help: false,
        noChat: false,
        debug: false,
        model: "gpt-4.1-mini",
        temperature: 1.0,
        timeout: 30,
        maxTokens: 8192,
        url: undefined,
        files: undefined,
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
        model: "gpt-4.1-mini",
        temperature: 1.0,
        timeout: 30,
        maxTokens: 8192,
        url: undefined,
        files: undefined,
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
        // timeout
        "-o",
        "600",
        // max token
        "-x",
        "500",
        // Ollama url
        "-u",
        "https://example.com",
        // 添付ファイルは複数添付可能
        "-f",
        "my_script.ts",
        "-f",
        "your_script.js",
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
        timeout: 600,
        maxTokens: 500,
        url: "https://example.com",
        files: ["my_script.ts", "your_script.js"],
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
