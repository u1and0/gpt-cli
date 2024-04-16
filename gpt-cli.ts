import { parse } from "https://deno.land/std/flags/mod.ts";
import { ChatOpenAI } from "npm:@langchain/openai";
import { ChatAnthropic } from "npm:@langchain/anthropic";
import { ChatOllama } from "npm:@langchain/community/chat_models/ollama";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";

const VERSION = "v0.4.0r";
const helpMessage = `ChatGPT API client for chat on console
    Usage:
      $ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string OpenAI or Anthropic model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, default gpt-3.5-turbo)
      -x, --max-tokens: number Number of AI answer tokens (default 1000)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -s, --system-prompt: string The first instruction given to guide the AI model's response
      -n, --no-conversation: boolean   No conversation mode. Just one time question and answer.
    PROMPT:
      string A Questions for Model`;

type Message = AIMessage | HumanMessage | SystemMessage | never; //{ role: Role; content: string };

// Parse arg
type Params = {
  version: boolean;
  help: boolean;
  noConversation: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  url?: string;
  systemPrompt?: string;
  content?: string;
};

/** 戻り値のIDがclearInterval()によって削除されるまで
 * ., .., ...を繰り返しターミナルに表示するロードスピナー
 * usage:
 *  const spinner = new Spinner([".", "..", "..."], 100);
 *  const spinnerID = spinner.start();
 *  // processing...
 *  spinner.stop(spinnerID);
 */
class Spinner {
  private timeout: number | undefined;
  private intervalId: number | undefined;

  constructor(
    private readonly texts: string[],
    private readonly interval: number,
    private readonly timeup: number,
  ) {
  }

  start(): void {
    let i = 0;
    const printSpinner = () => {
      i = ++i % this.texts.length;
      Deno.stderr.writeSync(new TextEncoder().encode("\r" + this.texts[i]));
    };

    printSpinner();
    this.intervalId = setInterval(printSpinner, this.interval);

    this.timeout = setTimeout(() => {
      this.stop();
      throw new Error("Timeout error");
    }, this.timeup);
  }

  stop(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    Deno.stderr.writeSync(new TextEncoder().encode("\r"));
  }
}

/** Parse console argument */
function parseArgs(): Params {
  const args = parse(Deno.args, {
    boolean: ["v", "version", "h", "help", "n", "no-conversation"],
    string: ["m", "model", "u", "url", "s", "system-prompt", "content"],
    number: ["v", "temperature", "x", "max-tokens"],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
      url: "http://localhost:11434",
    },
  });
  const params: Params = {
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    noConversation: args.n || args["no-conversation"] || false,
    model: args.m || args.model || "gpt-3.5-turbo",
    maxTokens: parseInt(String(args.x || args["max-tokens"])),
    temperature: parseFloat(String(args.t || args.temperature)),
    url: args.u || args.url,
    systemPrompt: String(args.s || args["systemPrompt"]),
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
  return params;
}

/** ユーザーの入力とシステムプロンプトをmessages内にセットする */
async function getUserInputInMessage(
  messages: Message[],
): Promise<HumanMessage | undefined> {
  // 最後のMessageがユーザーからのメッセージではない場合、
  // endlessInput()でユーザーからの質問を待ち受ける
  const lastMessage: Message | undefined = messages.at(-1);
  // console.debug(lastMessage);
  if (!(lastMessage instanceof HumanMessage)) {
    const input = await endlessInput();
    return new HumanMessage(input);
  }
  return;
  // console.debug(messages);
}

/** inputがなければ再度要求
 * q か exitが入力されたら正常終了
 */
async function endlessInput(): Promise<string> {
  let input: string | null;
  while (true) { // inputがなければ再度要求
    input = await multiInput();
    input = input.trim();
    if (input === null) continue;
    // q か exitが入力されたら正常終了
    if (input === "q" || input === "exit") Deno.exit(0);
    // 入力があったらその文字列を返す
    if (input) return input;
  }
}

/** Ctrl+Dが押されるまでユーザーの入力を求める。
Ctrl+Dで入力が確定されたらこれまでの入力を結合して文字列として返す。
*/
async function multiInput(): Promise<string> {
  const inputs: string[] = [];
  const decoder = new TextDecoder();
  const stdin = Deno.stdin;
  const buffer = new Uint8Array(100);
  // 同じ行にプロンプト表示
  const ps = "You: ";
  Deno.stdout.writeSync(new TextEncoder().encode(ps));

  while (true) {
    const n = await stdin.read(buffer);
    if (n === null) {
      break;
    }
    const input = decoder.decode(buffer.subarray(0, n)).trim();
    if (input === "") {
      continue;
    }
    inputs.push(input);
  }
  return inputs.join("\n");
}

/** Chatインスタンスを作成する
 * @param: Params - LLMのパラメータ、モデル */
class LLM {
  private readonly transrator:
    | ChatOpenAI
    | ChatAnthropic
    | ChatOllama
    | undefined;

  constructor(private readonly params: Params) {
    this.transrator = (() => {
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
      } else {
        console.log(params);
        return new ChatOllama({
          baseUrl: params.url,
          model: params.model, // "llama2:7b-chat",
        });
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

const main = async () => {
  // Parse command argument
  const params = parseArgs();
  // console.debug(params);
  if (params.version) {
    console.error(`gpt ${VERSION}`);
    Deno.exit(0);
  }
  if (params.help) {
    console.error(helpMessage);
    Deno.exit(0);
  }

  // 引数に従ったLLMインスタンスを作成
  const llm = new LLM(params);
  // コマンドライン引数systemPromptとcontentがあれば
  // システムプロンプトとユーザープロンプトを含めたMessageの生成
  const messages = [
    params.systemPrompt && new SystemMessage(params.systemPrompt),
    params.content && new HumanMessage(params.content),
  ].filter(Boolean) as Message[];

  try {
    // 一回限りの回答
    if (params.noConversation) {
      await llm.query(messages);
      return;
    }

    // 対話的回答
    while (true) {
      // 最後のメッセージがHumanMessageではない場合
      // ユーザーからの問いを追加
      const humanMessage = await getUserInputInMessage(messages);
      if (humanMessage) {
        messages.push(humanMessage);
      }
      // console.debug(messages);
      // AIからの回答を追加
      const aiMessage = await llm.ask(messages);
      if (!aiMessage) {
        throw new Error("LLM can not answer your question");
      }
      messages.push(aiMessage);
    }
  } catch (error) {
    console.error(error);
  }
};

main();
