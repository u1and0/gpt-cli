import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Command, SlashCommand } from "../lib/slash.ts";

Deno.test("SlashCommand constructor", () => {
  const testCases: [string, Command | string][] = [
    ["/help", "/help"],
    ["/help my content", "/help"], // multi word test
    ["/help\nmy content", "/help"], // \n trim test
    ["   /help my content", "/help"], // trim() test
    ["/help\tmy content", "/help"], // \t trim test
  ];

  for (const [args, expected] of testCases) {
    const actual = new SlashCommand(args).command;
    assertEquals(actual, expected);
  }
});
