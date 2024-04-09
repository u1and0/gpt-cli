import { parse } from "https://deno.land/std/flags/mod.ts";
import { ChatAnthropic, Stream } from "npm:@langchain/anthropic";
import { ChatOpenAI } from "npm:@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "npm:@langchain/core/messages";

type LLM = ChatOpenAI | ChatAnthropic;
type Message = AIMessage | HumanMessage | SystemMessage | never; //{ role: Role; content: string };

// Parse arg
type Params = {
  version: boolean;
  help: boolean;
  no_conversation: boolean;
  model: string;
  temperature: number;
  system_prompt?: string;
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
  constructor(
    private readonly texts: string[],
    private readonly interval: number,
  ) {}

  start(): number {
    let i = 0;
    return setInterval(() => {
      i = ++i % this.texts.length;
      Deno.stderr.writeSync(new TextEncoder().encode("\r" + this.texts[i]));
    }, this.interval);
  }

  /** Load spinner stop */
  stop(id: number) {
    clearInterval(id);
  }
}

const spinner = new Spinner([".", "..", "..."], 100);

/** Parse console argument */
function parseArgs(): Params {
  const args = parse(Deno.args, {
    boolean: ["v", "version", "h", "help", "n", "no-conversation"],
    string: ["m", "model", "s", "system-prompt", "content"],
    number: ["t", "temperature"],
    default: {
      temperature: 1.0,
      // "max-tokens": 1000,
    },
  });
  // args.content = args._.length > 0 ? args._.join(" ") : undefined; // 残りの引数をすべてスペースで結合
  const params: Params = {
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    no_conversation: args.n || args["no-conversation"] || false,
    model: args.m || args.model || "gpt-3.5-turbo",
    // max_tokens: parseInt(args.x || args["max-tokens"]) || 1000,
    temperature: parseFloat(args.t || args.temperature) || 1.0,
    system_prompt: args.s || args["systemPrompt"],
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

/** AIからのメッセージストリームを非同期に標準出力に表示 */
async function ask(llm: LLM, messages: Message[]): Promise<AIMessage> { // 1 chunkごとに出力
  const spinnerID = spinner.start();
  const stream = await llm.stream(messages);
  spinner.stop(spinnerID);
  console.log(); // スピナーと回答の間の改行
  const chunks: string[] = [];
  for await (const chunk of stream) {
    const s = chunk.content.toString();
    Deno.stdout.writeSync(new TextEncoder().encode(s));
    chunks.push(s);
  }
  console.log(); // 回答とプロンプトの間の改行
  return new AIMessage(chunks.join(""));
}

const main = async () => {
  const params = parseArgs();

  const llm = new ChatAnthropic({
    modelName: "claude-3-haiku-20240307",
  });

  // コマンドライン引数system_promptとcontentがあればMessageの生成
  let messages = [
    params.system_prompt && new SystemMessage(params.system_prompt),
    params.content && new HumanMessage(params.content),
  ].filter(Boolean) as Message[];

  // 無限ループ
  try {
    while (true) {
      // 最後のメッセージがHumanMessageではない場合
      // ユーザーからの問いを追加
      const humanMessage = await getUserInputInMessage(messages); // GPTと違ってsystem promptはmessagesにいれない
      if (humanMessage) {
        messages.push(humanMessage);
      }
      // console.debug(messages);
      // AIからの回答を追加
      const aiMessage = await ask(llm, messages);
      messages.push(aiMessage);
    }
  } catch (error) {
    console.error(error);
  }
};

main();
