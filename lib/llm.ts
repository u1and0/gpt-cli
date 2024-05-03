import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";

import { Spinner } from "./spinner.ts";

type Message = AIMessage | HumanMessage | SystemMessage | never; //{ role: Role; content: string };

/** Chatインスタンスを作成する
 * @param: Params - LLMのパラメータ、モデル */
export class LLM {
  private readonly transrator:
    | ChatOpenAI
    | ChatAnthropic
    | ChatOllama
    | undefined;

  constructor(private readonly params: Params) {
    this.transrator = (() => {
      const ollamaModels = [
        "llama",
        "mistral",
        "command-r",
        "llava",
        "mixtral",
        "deepseek",
        "phi",
        "hermes",
        "orca",
        "falcon",
        "dolphin",
        "gemma",
      ];
      const customModels = ["elyza"];
      const modelPatterns = ollamaModels.concat(customModels).map((m: string) =>
        new RegExp(m)
      );
      if (params.model.startsWith("gpt")) {
        return new ChatOpenAI({
          modelName: params.model,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
        });
      } else if (params.model.startsWith("claude")) {
        return new ChatAnthropic({
          modelName: params.model,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
        });
      } else if (
        // params.modelの文字列にollamaModelsのうちの一部が含まれていたらtrue
        modelPatterns.some((p: RegExp) => p.test(params.model))
      ) {
        return new ChatOllama({
          baseUrl: params.url, // http://yourIP:11434
          model: params.model, // "llama2:7b-chat", codellama:13b-fast-instruct, elyza:13b-fast-instruct ...
          maxTokens: params.maxTokens,
          temperature: params.temperature,
        });
      } else {
        throw new Error(`model not found "${params.model}"`);
      }
    })();
  }

  /** AI へ一回限りの質問をし、回答を出力して終了する */
  async query(messages: Message[]) {
    if (!this.transrator) return;
    const stream = await this.transrator.stream(messages); // 回答を取得
    for await (const chunk of stream) { // 1 chunkごとに出力
      const s = chunk.content.toString();
      Deno.stdout.writeSync(new TextEncoder().encode(s));
    }
  }

  /** AI へ対話形式に質問し、回答を得る */
  async ask(messages: Message[]): Promise<AIMessage | undefined> {
    if (!this.transrator) return;
    const spinner = new Spinner([".", "..", "..."], 100, 10000);
    spinner.start();
    const stream = await this.transrator.stream(messages); // 回答を取得
    spinner.stop();
    console.log(); // スピナーと回答の間の改行
    const chunks: string[] = [];
    const aiPrpompt = String(`${this.params.model}: `);
    Deno.stdout.writeSync(new TextEncoder().encode(aiPrpompt));
    for await (const chunk of stream) { // 1 chunkごとに出力
      const s = chunk.content.toString();
      Deno.stdout.writeSync(new TextEncoder().encode(s));
      chunks.push(s);
    }
    console.log(); // 回答とプロンプトの間の改行
    return new AIMessage(chunks.join(""));
  }
}
