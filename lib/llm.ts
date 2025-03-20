import Replicate from "npm:replicate";

import ServerSentEvent from "npm:replicate";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";
import { BaseMessageChunk } from "npm:@langchain/core/messages";

import { Spinner } from "./spinner.ts";
import { Params } from "./params.ts";
// import {
//   isPlatform,
//   platformMap,
// } from "./platform.ts";
import * as openModel from "./platform.ts";
import * as closedModel from "./model.ts";

/** AIMessage */
export type Message = AIMessage | HumanMessage | SystemMessage; //{ role: Role; content: string };

/** 定義されているすべてのLLM モデルインスタンスの型 */
type Model = openModel.OpenModel | closedModel.CloseModel;

/** LLMParam
 * LLM モデルに渡すパラメータ
 * - model
 * - max_tokens
 * - temperature
 */
export type LLMParam = {
  model: string;
  temperature: number;
  maxTokens: number;
};

/** Chatインスタンスを作成する
 * @param: Params - LLMのパラメータ、モデル */
export class LLM {
  public readonly transrator?: Model;

  constructor(private readonly params: Params) {
    this.transrator = llmConstructor(params);
  }

  /** AI へ一回限りの質問をし、回答を出力して終了する */
  async query(messages: Message[]) {
    const stream = await this.streamGenerator(messages);
    for await (const _ of streamEncoder(stream)) {
      //出力のために何もしない
    }
  }

  /** AI へ対話形式に質問し、回答を得る */
  async ask(messages: Message[]): Promise<AIMessage> {
    const spinner = new Spinner([".", "..", "..."], 100, 30000);
    // LLM に回答を考えさせる
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
   * AIからのメッセージストリームを非同期的に返します。
   *
   * @param : Message[] - 対話の流れの配列
   * @returns : Promise<IterableReadableStream<BaseMessageChunk>> AIからのメッセージストリーム
   * @throws : Invalid reference to model version: "${model}". Expected format: owner/name or owner/name:version
   *
   * Replicateクラスでない場合はLLMの標準的なストリームを返します。
   * Replicateクラスである場合は、Replicate.stream()に渡すためのinputを作成してから、渡します。
   */
  private async streamGenerator(
    messages: Message[],
  ): Promise<AsyncGenerator<BaseMessageChunk | ServerSentEvent>> {
    if (!this.transrator) {
      throw new Error("undefined transrator");
    } else if (this.transrator instanceof Replicate) { // Replicateのみ別処理
      const input = this.generateInput(messages);
      // 頭文字のreplicate/ を削除する
      const { platform: _, model } = openModel.split(this.params.model);
      if (!openModel.isReplicateModel(model)) {
        throw new Error(
          `Invalid reference to model version: "${model}". Expected format: owner/name or owner/name:version `,
        );
      }
      return this.transrator.stream(model, { input }) as AsyncGenerator<
        ServerSentEvent
      >;
    } else { // Replicate 以外の場合
      // @ts-ignore: exportされていない型だからasが使えないため
      return await this.transrator.stream(messages) as AsyncGenerator<
        BaseMessageChunk
      >;
    }
  }

  /** Replicate.stream()へ渡すinputの作成 */
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

/** Replicate.stream()へ渡すメッセージを作成する。
 *
 * @param : Message[] - AIMessage | HumanMessage | SystemMessage
 * @returns : string
 *
 * 次の例のようにフォーマットする。
 * SystemMessageは <<SYS>><</SYS>>で囲む。
 * HumanMessageは [INST][/INST]で囲む。ただし、1要素目は後述。
 * AIMessageは 何もしないで出力。
 * HumanMessageの1要素目はシステムプロンプトを囲う。
 *
 * ( 例 )
 * `<s>[INST] <<SYS>>
 * you are honest AI assistant
 * <</SYS>>
 *
 * hi [/INST]
 * hello, how can I help you?
 * [INST] what is your name? [/INST]
 * I have no name, just an AI`,
 *
 * See also test/llm_test.ts
 */
export function generatePrompt(messages: Message[]): string {
  // SystemMessageを取得
  const sys = messages.find((m: Message) => m instanceof SystemMessage);
  const systemPrompt = `<<SYS>>
${sys?.content ?? "You are helpful assistant."}
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
  const surroundINST = (messages: (AIMessage | HumanMessage)[]): string => {
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
  const humanAIPrompt = surroundINST(humanAIMessages);
  return `<s>[INST] ${systemPrompt}${humanAIPrompt}`;
}

/** メッセージストリームを標準出力に表示して文字列として結合して返す。
 * @param : AsyncGenerator<BaseMessageChunk | ServerSentEvent> - streamGenerator()で生成されたstream
 * @returns : AsyncGenerator<string> - 文字列が非同期にyieldされる
 */
async function* streamEncoder(
  stream: AsyncGenerator<BaseMessageChunk | ServerSentEvent>,
): AsyncGenerator<string> {
  for await (const chunk of stream) {
    const str = String(("content" in chunk) ? chunk.content : chunk); // 文字列化
    Deno.stdout.writeSync(new TextEncoder().encode(str)); // チャンクごとに標準出力へ表示
    yield str;
  }
}

/** LLM クラスのtransratorプロパティをparamsから判定し、
 * LLM インスタンスを生成して返す。
 * @param{Params} params - command line arguments parsed by parseArgs()
 * @return : LLM model
 * @throws{Error} model not found "${params.model}"
 */
function llmConstructor(params: Params): Model {
  // Closed modelがインスタンス化できるか
  // 正規表現でマッチング
  const createInstance = Object.keys(closedModel.modelMap).find((regex) =>
    new RegExp(regex).test(params.model)
  );

  // Closed modelが見つかればそれをインスタンス化して返す
  if (createInstance !== undefined) {
    return closedModel.modelMap[createInstance](params);
  }

  // Closed modelでマッチするモデルが見つからなかった場合、
  // Open model がインスタンス化できるか。
  //
  // llamaなどのオープンモデルはモデル名ではなく、
  // platform名で判定する

  // platformが特定できないときは空文字が返る
  const { platform, model } = openModel.split(params.model);
  // platformがオプションに指定されていなければエラー
  if (!openModel.isPlatform(platform)) {
    throw new Error(
      `unknown platform "${platform}", choose from ${
        openModel.platforms.join(", ")
      }`,
    );
  }

  // platformMap からオプションに指定したものがなければエラー
  const createInstanceFromPlatform = openModel.modelMap[platform];
  if (createInstanceFromPlatform === undefined) {
    throw new Error(`unknown model ${model}`);
  }

  return createInstanceFromPlatform(params);
}
