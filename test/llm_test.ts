import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import { ChatGroq } from "npm:@langchain/groq";
import { ChatTogetherAI } from "npm:@langchain/community/chat_models/togetherai";
import Replicate from "npm:replicate";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";

import {
  generatePrompt,
  LLM,
  parsePlatform,
  platformList,
} from "../lib/llm.ts";

Deno.test("Should create a ChatOpenAI instance for a GPT model", () => {
  Deno.env.set("OPENAI_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatOpenAI,
    `Expected LLM instance to be ChatOpenAI, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a ChatAnthropic instance for a Claude model", () => {
  Deno.env.set("ANTHROPIC_API_KEY", "sk-ant-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "claude-v1",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatAnthropic,
    `Expected LLM instance to be ChatAnthropic, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a ChatGoogleGenerativeAI instance for a Claude model", () => {
  Deno.env.set("GOOGLE_API_KEY", "11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "gemini-1.5-Pro",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatGoogleGenerativeAI,
    `Expected LLM instance to be ChatGoogleGenerativeAI, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a ChatOllama instance for an Ollama model", () => {
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "ollama/llama:7b-chat",
    url: "http://yourIP:11434",
    platform: "ollama",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatOllama,
    `Expected LLM instance to be ChatOllama, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a Replicate instance for an Replicate model", () => {
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "replicate/meta/llama2:7b-chat",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof Replicate,
    `Expected LLM instance to be Replicate, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a Groq instance for an Groq model", () => {
  Deno.env.set("GROQ_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "groq/llama-3.3-70b-versatile",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatGroq,
    `Expected LLM instance to be ChatGroq, but got ${llm.constructor.name}`,
  );
  assertEquals(llm.transrator.model, "llama-3.3-70b-versatile");
  assertEquals(llm.transrator.temperature, 0.7);
});

Deno.test("Should create a TogetherAI instance for an TogetherAI model", () => {
  Deno.env.set("TOGETHER_AI_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "togetherai/google/gemma-2-27b-it",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatTogetherAI,
    `Expected LLM instance to be ChatTogetherAI, but got ${llm.constructor.name}`,
  );
  assertEquals(llm.transrator.model, "google/gemma-2-27b-it");
});

Deno.test("Should throw an error for an unknown model", () => {
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "unknown-model",
    temperature: 0.7,
    maxTokens: 2048,
  };
  assertThrows(
    () => new LLM(params),
    Error,
    `unknown platform "", choose from ${platformList.join(", ")}`,
  );
});

Deno.test("Replicate prompt generator", () => {
  const messages = [
    new HumanMessage("hi"),
    new AIMessage("hello, how can I help you?"),
  ];
  const prompt = generatePrompt(messages);
  assertEquals(
    prompt,
    `<s>[INST] <<SYS>>
You are helpful assistant.
<</SYS>>

hi [/INST]
hello, how can I help you?`,
  );
});

Deno.test("Replicate prompt generator includes system prompt", () => {
  const messages = [
    new SystemMessage("you are honest AI assistant"),
    new HumanMessage("hi"),
    new AIMessage("hello, how can I help you?"),
    new HumanMessage("what is your name?"),
    new AIMessage("I have no name, just an AI"),
  ];
  const prompt = generatePrompt(messages);
  assertEquals(
    prompt,
    `<s>[INST] <<SYS>>
you are honest AI assistant
<</SYS>>

hi [/INST]
hello, how can I help you?
[INST] what is your name? [/INST]
I have no name, just an AI`,
  );
});

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
