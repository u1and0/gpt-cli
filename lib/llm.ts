import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import Replicate from "npm:replicate";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";
import { IterableReadableStream } from "npm:@langchain/core/util/stream";
import { BaseMessageChunk } from "npm:@langchain/core/messages/base";

import { Spinner } from "./spinner.ts";
import { Params } from "./parse.ts";

/** AIMessage */
export type Message = AIMessage | HumanMessage | SystemMessage | never; //{ role: Role; content: string };
type Model = `${string}/${string}`;

/** Chatインスタンスを作成する
 * @param: Params - LLMのパラメータ、モデル */
export class LLM {
  public readonly transrator:
    | ChatOpenAI
    | ChatAnthropic
    | ChatOllama
    | Replicate
    | undefined;

  constructor(private readonly params: Params) {
    this.transrator = (() => {
      const replicateModels = [
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
      const replicateModelPatterns = replicateModels.map((m: string) =>
        new RegExp(m)
      );
      // const ollamaModels = ["elyza"];
      // const ollamaModelPatterns = replicateModels.concat(ollamaModels).map((
      //   m: string,
      // ) => new RegExp(m));
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
      } else if (params.url !== undefined) {
        // params.modelの文字列にollamaModelsのうちの一部が含まれていたらtrue
        // ollamaModelPatterns.some((p: RegExp) => p.test(params.model))
        return new ChatOllama({
          baseUrl: params.url, // http://yourIP:11434
          model: params.model, // "llama2:7b-chat", codellama:13b-fast-instruct, elyza:13b-fast-instruct ...
          temperature: params.temperature,
        });
      } else if (
        // params.modelの文字列にollamaModelsのうちの一部が含まれていたらtrue
        replicateModelPatterns.some((p: RegExp) => p.test(params.model)) && // replicateモデルのパターンに一致
        (params.model as Model) === params.model // Model型に一致
      ) {
        return new Replicate();
      } else {
        throw new Error(`model not found "${params.model}"`);
      }
    })();
  }

  /** AI へ一回限りの質問をし、回答を出力して終了する */
  async query(messages: Message[]) {
    const stream = await this.streamGenerator(messages);
    streamEncoder(stream);
  }

  /** AI へ対話形式に質問し、回答を得る */
  async ask(messages: Message[]): Promise<AIMessage> {
    const spinner = new Spinner([".", "..", "..."], 100, 30000);
    spinner.start();
    const stream = await this.streamGenerator(messages);
    spinner.stop();
    console.log(); // スピナーと回答の間の改行
    const chunks: string[] = [];
    const modelName = `${this.params.model}: `;
    Deno.stdout.writeSync(new TextEncoder().encode(modelName)); // PS1
    // 標準出力後にchunksへ格納
    for await (const chunk of streamEncoder(stream)) {
      chunks.push(chunk);
    }
    console.log(); // 回答とプロンプトの間の改行
    return new AIMessage(chunks.join(""));
  }

  /** メッセージのストリームを生成する。
  このメソッドは非同期的に実行され、AIからのメッセージストリームを返します。

  @param : Message[] - 対話の流れの配列
  @returns : Promise<IterableReadableStream<BaseMessageChunk>> AIからのメッセージストリーム

  Replicateクラスでない場合はLLMの標準的なストリームを返します。
  Replicateクラスである場合は、Replicate.stream()に渡すためのinputを作成してから、渡します。
  */
  private async streamGenerator(
    messages: Message[],
  ): Promise<IterableReadableStream<BaseMessageChunk>> {
    if (!this.transrator) return;
    if (!(this.transrator instanceof Replicate)) {
      return await this.transrator.stream(messages); // 回答を取得
    } else {
      const input = this.generateInput(messages);
      return (this.transrator as Replicate).stream(
        this.params.model as Model,
        { input },
      );
    }
  }

  private generateInput(messages: Message[]) {
    return {
      top_k: -1, // Integer that controls the number of top tokens to consider. Set to -1 to consider all tokens. Default: -1
      top_p: 0.7, // Samples from top_p percentage of most likely tokens during decoding Default: 0.7
      temperature: this.params.temperature, // Adjusts randomness of outputs, greater than 1 is random and 0 is deterministic Default: 0.2
      presence_penalty: 0, // Float that penalizes new tokens based on whether they appear in the generated text so far.
      // Values > 0 encourage the model to use new tokens, while values < 0 encourage the model to repeat tokens.
      // これまでに生成されたテキストに出現したかどうかに基づいて、新しいトークンにペナルティを与える浮動小数点数。
      // 値 > 0 はモデルが新しいトークンを使うことを促し、値 < 0 はモデルがトークンを繰り返すことを促す。
      frequency_penalty: 0, // Float that penalizes new tokens based on their frequency in the generated text so far.
      // Values > 0 encourage the model to use new tokens, while values < 0 encourage the model to repeat tokens.
      // これまでの生成テキストにおける頻度に基づいて、新しいトークンにペナルティを与える浮動小数点数。
      // 値 > 0 はモデルが新しいトークンを使うことを促し、値 < 0 はモデルがトークンを繰り返すことを促す。
      max_new_tokens: this.params.maxTokens, // max_tokens: 1000 <- これは使えない
      prompt: generatePrompt(messages),
      // system_prompt: systemPrompt,
      // prompt_template:
      // `<s>[INST] <<SYS>> ${systemPrompt} <</SYS>> {prompt} [/INST]`,
    };
  }
}

export function generatePrompt(messages: Message[]): string {
  // SystemMessageを取得
  const sys = messages.find((m: Message) => m instanceof SystemMessage);
  const systemPrompt = `<<SYS>>
${sys?.content ?? ""}
<</SYS>>

`;

  // SystemMessageを削除
  const humanAIMessages = messages.filter((m) => !(m instanceof SystemMessage));
  // HumanMessageであることの判定
  const isUser = (message: AIMessage | HumanMessage): boolean => {
    return message.toDict().type === "human";
  };
  // HumanMessageは[INST][/INST] で囲む
  // AIMessageは何もしない
  const generatePrompt = (messages: (AIMessage | HumanMessage)[]): string => {
    return messages.map((message: AIMessage | HumanMessage, index: number) => {
      if (index === 0) {
        return `${message.content} [/INST]`;
      } else {
        return isUser(message)
          ? `[INST] ${message.content} [/INST]` // message.text is deplicated
          : `${message.content}`;
      }
    })
      .join("\n");
  };
  const humanAIPrompt = generatePrompt(humanAIMessages);
  return `<s>[INST] ${systemPrompt}${humanAIPrompt}`;
}

async function* streamEncoder(
  stream: IterableReadableStream<BaseMessageChunk>,
): AsyncGenerator<string> {
  for await (const chunk of stream) { // 1 chunkごとに出力
    const s = chunk.content?.toString() || chunk.toString();
    Deno.stdout.writeSync(new TextEncoder().encode(s));
    yield s;
  }
}
