import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Command, newSlashCommand } from "../lib/slash.ts";

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
