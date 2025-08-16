import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertInstanceOf } from "https://deno.land/std@0.224.0/assert/assert_instance_of.ts";

import { createOllamaInstance, createOpenRouterInstance, split } from "../lib/platform.ts";
import { Params } from "../lib/params.ts";
import { ChatOpenAI } from "npm:@langchain/openai";

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
  try {
    Deno.env.delete("OLLAMA_URL");
  } catch (e) {
    // Ignore if the variable doesn't exist
  }

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
  try {
    Deno.env.delete("OLLAMA_URL");
  } catch (e) {
    // Ignore if the variable doesn't exist
  }

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
  try {
    Deno.env.set("OLLAMA_URL", "http://env.url:11434");
  } catch (e) {
    // Ignore if we can't set the variable
  }

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
  try {
    Deno.env.delete("OLLAMA_URL");
  } catch (e) {
    // Ignore if the variable doesn't exist
  }
});

Deno.test("createOllamaInstance - params URL takes precedence over environment variable", () => {
  // Set the environment variable
  try {
    Deno.env.set("OLLAMA_URL", "http://env.url:11434");
  } catch (e) {
    // Ignore if we can't set the variable
  }

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
  try {
    Deno.env.delete("OLLAMA_URL");
  } catch (e) {
    // Ignore if the variable doesn't exist
  }
});

// Mock the OpenAI API key for testing
Deno.test("createOpenRouterInstance - creates ChatOpenAI instance with correct configuration", () => {
  // Set a mock API key
  const originalApiKey = Deno.env.get("OPENAI_API_KEY");
  Deno.env.set("OPENAI_API_KEY", "mock-api-key");

  try {
    const params: Params = {
      model: "openrouter/meta-llama/llama-3.1-8b-instruct",
      temperature: 0.7,
      maxTokens: 1000,
      version: false,
      help: false,
      noChat: false,
      debug: false,
    };

    const openRouter = createOpenRouterInstance(params);
    
    assertInstanceOf(openRouter, ChatOpenAI);
    assertEquals(openRouter.modelName, "meta-llama/llama-3.1-8b-instruct");
    assertEquals(openRouter.temperature, 0.7);
    
    // Clean up the mock
  } finally {
    if (originalApiKey) {
      Deno.env.set("OPENAI_API_KEY", originalApiKey);
    } else {
      Deno.env.delete("OPENAI_API_KEY");
    }
  }
});
