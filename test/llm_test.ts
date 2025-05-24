import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";
import { generatePrompt, LLM } from "../lib/llm.ts";
import * as openModel from "../lib/platform.ts";

// from model.ts
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { ChatXAI } from "npm:@langchain/xai";

// from platform.ts
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import { ChatGroq } from "npm:@langchain/groq";
import { ChatTogetherAI } from "npm:@langchain/community/chat_models/togetherai";
import { ChatFireworks } from "npm:@langchain/community/chat_models/fireworks";
import { ChatMistralAI } from "npm:@langchain/mistralai";
import Replicate from "npm:replicate";
import { HfInference } from "npm:@huggingface/inference";

Deno.test("Should create a ChatOpenAI instance for a GPT model", () => {
  Deno.env.set("OPENAI_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "gpt-4.1-mini",
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

Deno.test("Should create a ChatGoogleGenerativeAI instance for a Claude model", () => {
  Deno.env.set("GOOGLE_API_KEY", "11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "gemma-3-27b-it",
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatGoogleGenerativeAI,
    `Expected LLM instance to be ChatGoogleGenerativeAI, but got ${llm.constructor.name}`,
  );
});

Deno.test("Should create a ChatXAI instance for a X model", () => {
  Deno.env.set("XAI_API_KEY", "11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "grok-3-latest",
    temperature: 1,
    maxTokens: 4096,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatXAI,
    `Expected LLM instance to be ChatXAI, but got ${llm.constructor.name}`,
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

Deno.test("Should create a Fireworks instance for an TogetherAI model", () => {
  Deno.env.set("FIREWORKS_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "fireworks/deepseek-r1",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatFireworks,
    `Expected LLM instance to be ChatFireworks, but got ${llm.constructor.name}`,
  );
  assertEquals(llm.transrator.model, "accounts/fireworks/models/deepseek-r1");
});

Deno.test("Should create a MistralAI instance for an TogetherAI model", () => {
  Deno.env.set("MISTRAL_API_KEY", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "mistralai/mistral-large-latest",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof ChatMistralAI,
    `Expected LLM instance to be ChatMistralAI, but got ${llm.constructor.name}`,
  );
  assertEquals(llm.transrator.model, "mistral-large-latest");
});

Deno.test("Should create a Gemma3 instance for an Huggingface model", () => {
  Deno.env.set("HUGGINGFACE_ACCESS_TOKEN", "sk-11111");
  const params = {
    version: false,
    help: false,
    noChat: false,
    debug: false,
    model: "huggingface/google/gemma-3-4b-it",
    url: undefined,
    temperature: 0.7,
    maxTokens: 2048,
  };
  const llm = new LLM(params);
  assert(
    llm.transrator instanceof HfInference,
    `Expected LLM instance to be HfInference, but got ${llm.constructor.name}`,
  );
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
    `unknown platform "", choose from ${openModel.platforms.join(", ")}`,
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

Deno.test("Huggingface prompt generator includes system prompt", () => {
  const messages = [
    new SystemMessage("you are honest AI assistant"),
    new HumanMessage("hi"),
    new AIMessage("hello, how can I help you?"),
    new HumanMessage("what is your name?"),
    new AIMessage("I have no name, just an AI"),
  ];
  const prompt = LLM.formatHuggingFacePrompt(messages);
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
