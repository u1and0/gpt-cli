/**
 * 特定企業に依存したクローズドモデルのLLMインスタンスを生成する関数を定義します。
 * その呼出元modelMapを公開します。
 */
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "npm:@langchain/google-genai";
import { ChatXAI } from "npm:@langchain/xai";

import { Params } from "./params.ts";

export type CloseModel =
  | ChatOpenAI
  | ChatAnthropic
  | ChatGoogleGenerativeAI
  | ChatXAI;

type ModelMap = { [key: string]: (params: Params) => CloseModel };

const createOpenAIInstance = (params: Params): ChatOpenAI => {
  return new ChatOpenAI({
    modelName: params.model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createOpenAIOModelInstance = (params: Params): ChatOpenAI => {
  return new ChatOpenAI({
    modelName: params.model,
    temperature: params.temperature,
    // max_completion_tokens: params.maxTokens,
  });
};

const createAnthropicInstance = (params: Params): ChatAnthropic => {
  return new ChatAnthropic({
    modelName: params.model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createGoogleGenerativeAIInstance = (
  params: Params,
): ChatGoogleGenerativeAI => {
  return new ChatGoogleGenerativeAI({
    model: params.model,
    temperature: params.temperature,
    maxOutputTokens: params.maxTokens,
  });
};

const createXAIInstance = (params: Params): ChatXAI => {
  return new ChatXAI({
    model: params.model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

export const modelMap: ModelMap = {
  "^gpt": createOpenAIInstance,
  "^o[0-9]": createOpenAIOModelInstance,
  "^claude": createAnthropicInstance,
  "^gemini": createGoogleGenerativeAIInstance,
  "^grok": createXAIInstance,
} as const;
