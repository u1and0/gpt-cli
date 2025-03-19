import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";

import { parsePlatform } from "../lib/platform.ts";

Deno.test("parsePlatform - valid model string", () => {
  const { platform, model } = parsePlatform("replicate/meta/llama3.3-70b");
  assertEquals(platform, "replicate");
  assertEquals(model, "meta/llama3.3-70b");
});

Deno.test("parsePlatform - model string with only one part", () => {
  const { platform, model } = parsePlatform("modelonly");
  assertEquals(platform, "");
  assertEquals(model, "modelonly");
});

Deno.test("parsePlatform - model string with multiple slashes", () => {
  const { platform, model } = parsePlatform("a/b/c/d");
  assertEquals(platform, "a");
  assertEquals(model, "b/c/d");
});

Deno.test("parsePlatform - model string starts with slash", () => {
  const { platform, model } = parsePlatform("/a/b/c");
  assertEquals(platform, "");
  assertEquals(model, "a/b/c");
});
