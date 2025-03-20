import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";

import { split } from "../lib/platform.ts";

Deno.test("split - valid model string", () => {
  const { platform, model } = split("replicate/meta/llama3.3-70b");
  assertEquals(platform, "replicate");
  assertEquals(model, "meta/llama3.3-70b");
});

Deno.test("split - model string with only one part", () => {
  const { platform, model } = split("modelonly");
  assertEquals(platform, "");
  assertEquals(model, "modelonly");
});

Deno.test("split - model string with multiple slashes", () => {
  const { platform, model } = split("a/b/c/d");
  assertEquals(platform, "a");
  assertEquals(model, "b/c/d");
});

Deno.test("split - model string starts with slash", () => {
  const { platform, model } = split("/a/b/c");
  assertEquals(platform, "");
  assertEquals(model, "a/b/c");
});
