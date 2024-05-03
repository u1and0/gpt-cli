import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";
import { LLM } from "../lib/llm.ts";
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";

Deno.test("Should create a ChatOpenAI instance for a GPT model", () => {
  Deno.env.set("OPENAI_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noConversation: false,
    model: "gpt-3.5-turbo",
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
    noConversation: false,
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

Deno.test("Should create a ChatOllama instance for an Ollama model", () => {
  const params = {
    version: false,
    help: false,
    noConversation: false,
    model: "llama:7b-chat",
    url: "http://yourIP:11434",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatOllama,
    `Expected LLM instance to be ChatOllama, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should throw an error for an unknown model", () => {
  const params = {
    version: false,
    help: false,
    noConversation: false,
    model: "unknown-model",
    temperature: 0.7,
    maxTokens: 2048,
  };
  assertThrows(() => new LLM(params), Error, 'model not found "unknown-model"');
});
