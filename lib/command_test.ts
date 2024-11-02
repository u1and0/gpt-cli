import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Command, extractAtModel, newSlashCommand } from "../lib/slash.ts";

Deno.test("SlashCommand constructor", () => {
  const testCases: [string, Command | string][] = [
    ["/help", "HELP"],
    ["/help my content", "HELP"], // multi word test
    ["/help\nmy content", "HELP"], // \n trim test
    ["   /help my content", "HELP"], // trim() test
    ["/help\tmy content", "HELP"], // \t trim test
  ];

  for (const [args, expected] of testCases) {
    const actual = newSlashCommand(args);
    assertEquals(actual, expected);
  }
});

Deno.test("ユーザーの入力が@から始まると、@に続くモデル名を返す", () => {
  const testCases: [string, string | undefined][] = [
    ["@modelName arg1 arg2", "modelName"], // 行頭に@が入るとモデル名を返す
    [" @modelName arg1 arg2", undefined], // 行頭にスペースが入ると@コマンドではない
    ["plain text", undefined],
  ];

  for (const [args, expected] of testCases) {
    const actual = extractAtModel(args);
    assertEquals(actual.model, expected);
  }
});
