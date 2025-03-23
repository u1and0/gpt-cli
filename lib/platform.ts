/**
 * 特定企業に依存しないオープンモデルのLLMインスタンスを生成する関数を定義します。
 * その呼出元modelMapを公開します。
 *
 * # モデルの追加の仕方
 *
 * 1.  対応するLangChainのモデルのimportを追加します。
 *     例: `import { ChatHogeHoge } from "npm:@langchain/hoge-hoge";`
 * 2.  `CloseModel` 型に、追加したモデルの型を追加します。
 *     例: `| ChatHogeHoge;`
 * 3.  モデルのインスタンスを生成する関数を作成します。
 *     - Paramsを受け取り、LangChainのモデルを返す関数
 *     例:
 *     ```typescript
 *     const createHogeHogeInstance = (params: Params): ChatHogeHoge => {
 *       return new ChatHogeHoge({
 *         modelName: params.model,
 *         temperature: params.temperature,
 *         maxTokens: params.maxTokens,
 *       });
 *     };
 *     ```
 * 4.  `modelMap` に、モデルを識別するためのキーと、3で作成した関数を登録します。
 *     - キーは、モデル名にマッチする正規表現です。
 *     例: `"^hoge": createHogeHogeInstance,`
 */

import { ChatGroq } from "npm:@langchain/groq";
import { ChatTogetherAI } from "npm:@langchain/community/chat_models/togetherai";
import { ChatFireworks } from "npm:@langchain/community/chat_models/fireworks";
import { ChatMistralAI } from "npm:@langchain/mistralai";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import Replicate from "npm:replicate";

import { Params } from "./params.ts";

/** Platformオプション
 * open model を公開している企業名など。
 *
 * llamaモデルは共通のオープンモデルなので、
 * どのプラットフォームで実行するかを決める必要がある
 */
export const platforms = [
  "groq",
  "togetherai",
  "fireworks",
  "mistralai",
  "ollama",
  "replicate",
];

/**
 * Platform 型は platformsのarrayから生成される型
 * これ以外のPlatformを入れるとエラー
 */
export type Platform = (typeof platforms)[number];

/**
 * OpenModel 型は 各プラットフォームのChatインスタンスに
 * Repliceteインスタンスを加えたもの
 */
export type OpenModel =
  | ChatGroq
  | ChatTogetherAI
  | ChatFireworks
  | ChatMistralAI
  | ChatOllama
  | Replicate;

/** Platformごとに返すモデルのインスタンスを返す関数 */
type PlatformMap = { [key in Platform]: (params: Params) => OpenModel };

/** replicateで使うモデルは以下の形式
 * owner/name or owner/name:version
 */
type ReplicateModel = `${string}/${string}`;

/** Platform型であることを保証する */
export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" &&
    platforms.includes(value as Platform);
}

/** ReplicateModel型であることを保証する */
export function isReplicateModel(value: unknown): value is ReplicateModel {
  return typeof value === "string" &&
    value.includes("/") &&
    value.split("/").length === 2;
}

const createGroqInstance = (params: Params): ChatGroq => {
  const { platform: _, model } = split(params.model);
  return new ChatGroq({
    model: model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createTogetherAIInstance = (params: Params): ChatTogetherAI => {
  const { platform: _, model } = split(params.model);
  return new ChatTogetherAI({
    model: model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createFireworksInstance = (params: Params): ChatFireworks => {
  const { platform: _, model } = split(params.model);
  return new ChatFireworks({
    model: `accounts/fireworks/models/${model}`,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createMistralAIInstance = (params: Params): ChatMistralAI => {
  const { platform: _, model } = split(params.model);
  return new ChatMistralAI({
    model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
};

const createOllamaInstance = (params: Params): ChatOllama => {
  // ollamaの場合は、ollamaが動作するサーバーのbaseUrlが必須
  if (params.url === undefined) {
    throw new Error(
      "ollama needs URL parameter with `--url http://your.host:11434`",
    );
  }
  const { platform: _, model } = split(params.model);
  return new ChatOllama({
    baseUrl: params.url, // http://yourIP:11434
    model: model, // "llama2:7b-chat", codellama:13b-fast-instruct, elyza:13b-fast-instruct ...
    temperature: params.temperature,
    // maxTokens: params.maxTokens, // Not implemented yet on Langchain
  });
};

const createReplicateInstance = (params: Params): Replicate => {
  const { platform: _, model } = split(params.model);
  if (isReplicateModel(model)) {
    return new Replicate();
  } else {
    throw new Error(
      `Invalid reference to model version: "${model}". Expected format: owner/name or owner/name:version `,
    );
  }
};

/** １つ目の"/"で引数を分割して、
 * １つ目をplatformとして、
 * 2つめ移行をmodelとして返す
 */
export function split(
  model: string,
): { platform: string; model: string } {
  const parts = model.split("/");
  if (parts.length < 2) {
    return { platform: "", model: model };
  }
  const platform = parts[0];
  const modelName = parts.slice(1).join("/");
  return { platform, model: modelName };
}

/** 各プラットフォーム毎にインスタンス化する関数を定義したマップ
 * PlatformMapのキーは platforms で
 * type Platform 定義されているので、
 * platformsとことなるマップのキーはコンパイルエラーになる
 */
export const modelMap: PlatformMap = {
  "groq": createGroqInstance,
  "togetherai": createTogetherAIInstance,
  "fireworks": createFireworksInstance,
  "mistralai": createMistralAIInstance,
  "ollama": createOllamaInstance,
  "replicate": createReplicateInstance,
} as const;
