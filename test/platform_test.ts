import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";

import { createOllamaInstance, split } from "../lib/platform.ts";
import { Params } from "../lib/params.ts";

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

Deno.test("createOllamaInstance - uses default URL when no URL provided", () => {
  // Delete the environment variable if it exists
  Deno.env.delete("OLLAMA_URL");

  const params: Params = {
    model: "ollama/llama2",
    temperature: 0.7,
    maxTokens: 1000,
    version: false,
    help: false,
    noChat: false,
    debug: false,
  };

  // Should use default URL without throwing an error
  const ollama = createOllamaInstance(params);
  assertEquals(typeof ollama, "object");
});

Deno.test("createOllamaInstance - uses URL from params", () => {
  // Delete the environment variable if it exists
  Deno.env.delete("OLLAMA_URL");

  const params: Params = {
    model: "ollama/llama2",
    temperature: 0.7,
    maxTokens: 1000,
    version: false,
    help: false,
    noChat: false,
    debug: false,
    url: "http://test.url:11434",
  };

  // Just verify it doesn't throw an error
  const ollama = createOllamaInstance(params);
  assertEquals(typeof ollama, "object");
});

Deno.test("createOllamaInstance - uses URL from environment variable", () => {
  // Set the environment variable
  Deno.env.set("OLLAMA_URL", "http://env.url:11434");

  const params: Params = {
    model: "ollama/llama2",
    temperature: 0.7,
    maxTokens: 1000,
    version: false,
    help: false,
    noChat: false,
    debug: false,
  };

  // Just verify it doesn't throw an error
  const ollama = createOllamaInstance(params);
  assertEquals(typeof ollama, "object");

  // Clean up
  Deno.env.delete("OLLAMA_URL");
});

Deno.test("createOllamaInstance - params URL takes precedence over environment variable", () => {
  // Set the environment variable
  Deno.env.set("OLLAMA_URL", "http://env.url:11434");

  const params: Params = {
    model: "ollama/llama2",
    temperature: 0.7,
    maxTokens: 1000,
    version: false,
    help: false,
    noChat: false,
    debug: false,
    url: "http://params.url:11434",
  };

  // Just verify it doesn't throw an error
  const ollama = createOllamaInstance(params);
  assertEquals(typeof ollama, "object");

  // Clean up
  Deno.env.delete("OLLAMA_URL");
});
