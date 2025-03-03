import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertExists } from "https://deno.land/std@0.224.0/assert/assert_exists.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { Command, extractAtModel, newSlashCommand } from "../lib/command.ts";
// Focus on command parsing functionality only - no message handling

Deno.test("SlashCommand constructor - basic commands", () => {
  const testCases: [string, Command][] = [
    ["/help", Command.Help],
    ["/help my content", Command.Help], // multi word test
    ["/help\nmy content", Command.Help], // \n trim test
    ["   /help my content", Command.Help], // trim() test
    ["/help\tmy content", Command.Help], // \t trim test
    ["/clear", Command.Clear],
    ["/modelStack", Command.ModelStack],
    ["/bye", Command.Bye],
    ["/exit", Command.Bye],
    ["/quit", Command.Bye],
  ];

  for (const [args, expected] of testCases) {
    const actual = newSlashCommand(args);
    assertEquals(actual, expected);
  }
});

Deno.test("SlashCommand constructor - file command", () => {
  const testCases = [
    { input: "/file /path/to/test.ts", expectedPath: "/path/to/test.ts" },
    { input: "/file ./relative/path.js", expectedPath: "./relative/path.js" },
    { input: "/file  multiple/spaces.txt", expectedPath: "multiple/spaces.txt" },
    { input: "/file\ttab.py", expectedPath: "tab.py" },
  ];
  
  for (const { input, expectedPath } of testCases) {
    const result = newSlashCommand(input);
    
    // Check if result is an object with command and path properties
    assert(typeof result === 'object' && 'command' in result, 
      `Expected object with command property for input: "${input}"`);
    const fileCommand = result as { command: Command; path: string };
    
    assertEquals(fileCommand.command, Command.File, 
      `Expected Command.File for input: "${input}"`);
    assertEquals(fileCommand.path, expectedPath, 
      `Expected path "${expectedPath}" for input: "${input}"`);
  }
});

Deno.test("ユーザーの入力が@から始まると、@に続くモデル名を返す", () => {
  const testCases: [string, string][] = [
    ["@modelName arg1 arg2", "modelName"], // 行頭に@が入るとモデル名を返す
    [" @modelName arg1 arg2", ""], // 行頭にスペースが入ると@コマンドではない
    ["plain text", ""],
  ];

  for (const [args, expected] of testCases) {
    const actual = extractAtModel(args);
    assertEquals(actual.model, expected);
  }
});

