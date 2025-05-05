import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";
import type {
  BaseMessage,
  BaseMessageChunk,
  MessageFieldWithRole,
} from "npm:@langchain/core/messages";

import Replicate from "npm:replicate";
import ServerSentEvent from "npm:replicate";

import type { ChatCompletionStreamOutput } from "npm:@huggingface/tasks";
import { HfInference } from "npm:@huggingface/inference";

import { Spinner } from "./spinner.ts";
import { Params } from "./params.ts";
// import {
//   isPlatform,
//   platformMap,
// } from "./platform.ts";
import * as openModel from "./platform.ts";
import * as closedModel from "./model.ts";

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

function toRoleContent(message: BaseMessage): MessageFieldWithRole {
  return {
    role: message.getType(),
    content: message.content,
  };
}

/** Chatインスタンスを作成する
 * @param: Params - LLMのパラメータ、モデル */
export class LLM {
  public readonly transrator?: Model;

  constructor(private readonly params: Params) {
    this.transrator = llmConstructor(params);
  }

  /** AI へ一回限りの質問をし、回答を出力して終了する */
  async query(messages: BaseMessage[]) {
    const stream = await this.streamGenerator(messages);
    for await (const _ of streamEncoder(stream)) {
      // 出力のために何もしない
    }
  }

  /** AI へ対話形式に質問し、回答を得る */
  async ask(messages: BaseMessage[]): Promise<AIMessage> {
    const interval = 100;
    const timeup = 30000;
    const spinner = new Spinner([".", "..", "..."], interval, timeup);
    let aiMessage: string;
    // LLM に回答を考えさせる
    try {
      // 回答が出るまでスピナー出力
      spinner.start();
      const stream = await this.streamGenerator(messages);
      spinner.stop();

      // 回答の出力
      console.log(); // スピナーと回答の間の改行
      const chunks: string[] = [];
      const modelName = `${this.params.model}: `;
      Deno.stdout.writeSync(new TextEncoder().encode(modelName)); // PS1
      // 標準出力後にchunksへ格納
      for await (const chunk of streamEncoder(stream)) {
        chunks.push(chunk);
      }
      console.log(); // 回答とプロンプトの間の改行
      aiMessage = chunks.join("");
    } catch (error) {
      console.error(`Error in llm.ask(): ${error}`);
      aiMessage = "申し訳ありません。質問に回答できませんでした。";
    }
    return new AIMessage(aiMessage);
  }

  /** メッセージのストリームを生成する。
   * AIからのメッセージストリームを非同期的に返します。
   *
   * @param : BaseMessage[] - 対話の流れの配列
   * @returns : Promise<IterableReadableStream<BaseMessageChunk>> AIからのメッセージストリーム
   * @throws : Invalid reference to model version: "${model}". Expected format: owner/name or owner/name:version
   *
   * Replicateクラスでない場合はLLMの標準的なストリームを返します。
   * Replicateクラスである場合は、Replicate.stream()に渡すためのinputを作成してから、渡します。
   * HuggingFaceクラスである場合は、TODO
   */
  private async streamGenerator(
    messages: BaseMessage[],
  ): Promise<
    AsyncGenerator<
      BaseMessageChunk | ServerSentEvent | ChatCompletionStreamOutput
    >
  > {
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
    } else if (this.transrator instanceof HfInference) { // HuggingFace のみ別処理
      const { platform: _, model } = openModel.split(this.params.model);
      // const inputs = LLM.formatHuggingFacePrompt(messages);
      // const parameters = {
      //   max_new_tokens: this.params.maxTokens,
      //   temperature: this.params.temperature,
      //   return_full_text: false,
      // };

      // this.params.debug && console.debug(
      //   "\nHuggingface model:",
      //   model,
      //   "\nHuggingface inputs:",
      //   inputs,
      //   "\nHuggingface parameters:",
      //   parameters,
      // );

      return this.transrator.chatCompletionStream(
        {
          model,
          messages: messages.map((m: BaseMessage) => toRoleContent(m)),
          max_tokens: this.params.maxTokens,
          temperature: this.params.temperature,
        },
      );
    } else { // Replicate 以外の場合
      // @ts-ignore: exportされていない型だからasが使えないため
      return await this.transrator.stream(messages) as AsyncGenerator<
        BaseMessageChunk
      >;
    }
  }

  /**
   * HugginFace stream
   */
  // private async *huggingFaceStream(
  //   messages: BaseMessage[],
  // ): AsyncGenerator<BaseMessageChunk> {
  //   try {
  //     const response = await (this.transrator as HfInference)
  //       .textGenerationStream(
  //         { model, inputs, parameters },
  //         /* { useCache: false }*/
  //       );
  //
  //     // Create a message chunk with the response
  //     const content = response.generated_text || "";
  //     yield new AIMessageChunk({ content });
  //   } catch (error) {
  //     console.error("Error in HuggingFace text generation:", error);
  //     yield new AIMessageChunk({
  //       content: `Error: ${(error as Error).message}`,
  //     });
  //   }
  // }

  /** Replicate.stream()へ渡すinputの作成 */
  private generateInput(messages: BaseMessage[]) {
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

  /**
   * Huggingfaceモデルへのプロンプトの組み立て
   */
  static formatHuggingFacePrompt(messages: BaseMessage[]): string {
    // システムプロンプトの追加
    const systemMessage = messages.find((m) => m instanceof SystemMessage);
    const systemPrompt = systemMessage?.content ??
      "You are a helpful assistant";
    const conversationMessages = messages.filter((m) =>
      !(m instanceof SystemMessage)
    );

    let prompt = "<s>[INST] ";
    if (systemPrompt) {
      prompt += `<<SYS>>\n${systemPrompt}\n<</SYS>>\n\n`;
    }

    // ユーザープロンプトの整形
    conversationMessages.forEach((message, index) => {
      if (message instanceof HumanMessage) {
        prompt += `${index === 0 ? "" : "\n[INST] "}${message.content} [/INST]`;
      } else if (message instanceof AIMessage) {
        prompt += `\n${message.content}`;
      }
    });

    return prompt;
  }
}

/** Replicate.stream()へ渡すメッセージを作成する。
 *
 * @param : BaseMessage[] - AIMessage | HumanMessage | SystemMessage
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
export function generatePrompt(messages: BaseMessage[]): string {
  // SystemMessageを取得
  const sys = messages.find((m: BaseMessage) => m instanceof SystemMessage);
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
  stream: AsyncGenerator<
    BaseMessageChunk | ServerSentEvent | ChatCompletionStreamOutput
  >,
): AsyncGenerator<string> {
  for await (const chunk of stream) {
    const str = String(
      ("content" in chunk)
        ? chunk.content
        // for huggingface select chunk from stream
        : ("choices" in chunk)
        ? chunk.choices[0].delta.content
        : chunk,
    ); // 文字列化
    Deno.stdout.writeSync(new TextEncoder().encode(str)); // チャンクごとに標準出力へ表示
    yield str;
  }
}

/** LLM クラスのtransratorプロパティをparamsから判定し、
 * LLM インスタンスを生成して返す。
 * @param{Params} params - command line arguments parsed by parseArgs()
 * @return : LLM model
 * @throws {Error} model not found "params.model"
 * @throws {Error} unknown platform
 */
function llmConstructor(params: Params): Model {
  // Closed modelがインスタンス化できるか
  // 正規表現でマッチング
  const createInstance = Object.keys(closedModel.modelMap).find((regex) =>
    new RegExp(regex).test(params.model)
  );

  // Closed modelが見つかればそれをインスタンス化して返す
  if (createInstance !== undefined) {
    // LLM インスタンスを返すアロー関数をclosedModelのマップから選択する
    const llmInstance: (params: Params) => closedModel.CloseModel =
      closedModel.modelMap[createInstance];
    return llmInstance(params);
  }

  // Closed modelでマッチするモデルが見つからなかった場合、
  // Open model がインスタンス化できるか検証する。
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
  // LLM インスタンスを返すアロー関数をopenModelのマップから選択する
  const llmInstance: (params: Params) => openModel.OpenModel =
    openModel.modelMap[platform];
  if (llmInstance === undefined) {
    throw new Error(`unknown model ${model}`);
  }

  return llmInstance(params);
}
