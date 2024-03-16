/* ChatGPT API client for chat on console
 * Usage:
 *   $ gpt -h
 * Install:
 *  $ deno install --allow-net --allow-env --name gpt gpt-cli.ts
 *  # then `source PATH=~/.deno/bin/gpt:$PATH`
 *  #
 *  # As a binary
 *  # deno compile --allow-net --allow-env --output gpt gpt-cli.ts
 */
import { parse } from "https://deno.land/std/flags/mod.ts";
import OpenAI from "https://deno.land/x/openai/mod.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

const VERSION = "v0.3.1";
const helpMessage = `ChatGPT API client for chat on console
    Usage:
      $ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string OpenAI or Anthropic model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, default gpt-3.5-turbo)
      -x, --max_tokens: number Number of AI answer tokens (default 1000)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -s, --system_prompt: string The first instruction given to guide the AI model's response
    PROMPT:
      string A Questions for Model`;
// MODELS:
//   You can use model: ${models}, see OpenAI or Anthropic website for detail.`;

// Parse arg
type Params = {
  version: boolean;
  help: boolean;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  content?: string;
};

// Input Object
enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
}
type Message = { role: Role; content: string };

// Output Object
type Content = {
  type: string;
  text: string;
  role: Role;
  content: string;
};

type Choices = {
  index: number;
  message: Content;
};

type Usage = {
  input_tokens: number;
  output_tokens: number;
};

type Response = {
  id: string;
  type: string;
  role: Role;
  content: Array<Content>;
  choices: Array<Choices>;
  model: string;
  usage: Usage;
  error: string;
};

interface LLM {
  agent: (messages: Message[]) => Promise<void>;
  ask(messages: Message[]): Promise<void>;
  getContent(data: Response): string;
}

/** ユーザーの入力とシステムプロンプトをmessages内にセットする */
async function setUserInputInMessage(messages: Message[]): Promise<Message[]> {
  // console.debug(messages);
  // messagesの中身が空の場合 または role: "user"が最後ではない場合、
  // endlessInput()でユーザーからの質問を待ち受ける
  const lastMessage: Message | undefined = messages.at(-1);
  // console.debug(lastMessage);
  if (lastMessage?.role !== Role.User) {
    const input = await endlessInput();
    // userの質問をmessagesに追加
    messages.push({ role: Role.User, content: input });
  }
  return messages;
}

class GPT implements LLM {
  agent: (messages: Message[]) => Promise<void>;

  constructor(
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly systemPrompt?: string,
  ) {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }
    const openai = new OpenAI({ apiKey });
    this.agent = (messages: Message[]) => {
      return openai.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages,
      });
    };
  }

  public getContent(data: Response): string {
    return data.choices[0].message.content;
  }

  /** system promptが与えられており
   * messagesの中にsystem promptがなければ
   */
  public pushSustemPrompt(messages: Message[]): Message[] {
    const hasSystemRole = messages.some(
      (message) => message.role === Role.System,
    );
    // messagesの最初に追加
    if (!hasSystemRole && this.systemPrompt) {
      messages.unshift({ role: Role.System, content: this.systemPrompt });
    }
    return messages;
  }

  /** ChatGPT へ対話形式に質問し、回答を得る */
  public async ask(messages: Message[]) {
    messages = await setUserInputInMessage(messages);
    if (this.systemPrompt) {
      messages = this.pushSustemPrompt(messages);
    }
    // Load spinner start
    const spinner = loadSpinner([".", "..", "..."], 100);

    // POST data to OpenAI API
    const resp = await this.agent(messages);
    clearInterval(spinner); // Load spinner stop
    messages = await this.print(resp, messages);
    await this.ask(messages);
  }

  // print1by1() の完了を待つために
  // async (data)として、print1by1()をawaitする
  public async print(response: Response, messages: Message[]) {
    if (response.error) {
      throw new Error(`Fetch request failed: ${response.error}`);
    }
    const content = this.getContent(response);
    // assistantの回答をmessagesに追加
    messages.push({ role: Role.Assistant, content: content });
    // console.debug(messages);
    await print1by1(`\n${this.model}: ${content}`);
    return messages;
  }
}

class Claude implements LLM {
  agent: (messages: Message[]) => Promise<void>;

  constructor(
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly systemPrompt?: string,
  ) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
    }
    const anthropic = new Anthropic({ apiKey });
    this.agent = (messages: Message[]) => {
      return anthropic.messages.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        system: this.systemPrompt, // GPTと違ってsystem promptはsystemに入れる
        messages,
      });
    };
  }

  public getContent(data: Response): string {
    return data.content[0].text;
  }

  /** Claude へ対話形式に質問し、回答を得る */
  public async ask(messages: Message[]) {
    messages = await setUserInputInMessage(messages); // GPTと違ってsystem promptはmessagesにいれない
    // Load spinner start
    const spinner = loadSpinner([".", "..", "..."], 100);

    // POST data to Anthropic API
    const resp = await this.agent(messages);
    clearInterval(spinner); // Load spinner stop
    messages = await this.print(resp, messages);
    await this.ask(messages);
  }

  // print1by1() の完了を待つために
  // async (data)として、print1by1()をawaitする
  public async print(response: Response, messages: Message[]) {
    if (response.error) {
      throw new Error(`Fetch request failed: ${response.error}`);
    }
    const content = this.getContent(response);
    // assistantの回答をmessagesに追加
    messages.push({ role: Role.Assistant, content: content });
    // console.debug(messages);
    await print1by1(`\n${this.model}: ${content}`);
    return messages;
  }
}

// 戻り値のIDがclearInterval()によって削除されるまで
// ., .., ...を繰り返しターミナルに表示するロードスピナー
// usage:
//   const spinner = loadSpinner();
//   // 処理
//   await fetch(url, data)
//     .then((response) => {
//       clearInterval(spinner); // Stop spinner
//       return response.json();
//     })
export function loadSpinner(frames: string[], interval: number): number {
  let i = 0;
  return setInterval(() => {
    i = ++i % frames.length;
    Deno.stdout.writeSync(new TextEncoder().encode("\r" + frames[i]));
  }, interval);
}

// 渡された文字列を1文字ずつ20msecごとにターミナルに表示する
export async function print1by1(str: string): Promise<void> {
  str += "\n";
  return await new Promise((resolve) => {
    let i = 0;
    const intervalId = setInterval(() => {
      Deno.stdout.writeSync(new TextEncoder().encode(str[i]));
      i++;
      if (i === str.length) {
        clearInterval(intervalId);
        resolve();
      }
    }, 20);
  });
}

// Ctrl+Dが押されるまでユーザーの入力を求める。
// Ctrl+Dで入力が確定されたらこれまでの入力を結合して文字列として返す。
export async function multiInput(): Promise<string> {
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

/** Parse console argument */
function parseArgs(): Params {
  const args = parse(Deno.args);
  return {
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    model: args.m || args.model || "gpt-3.5-turbo",
    max_tokens: parseInt(args.x || args.max_tokens) || 1000,
    temperature: parseFloat(args.t || args.temperature) || 1.0,
    system_prompt: args.s || args.system_prompt,
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
}

function main() {
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
  console.log("Ctrl-D to confirm input, q or exit to end conversation");

  // LLM ask
  let llm: LLM;
  try {
    if (params.model.includes("gpt")) {
      llm = new GPT(
        params.model,
        params.temperature,
        params.max_tokens,
        params.system_prompt,
      );
    } else if (params.model.includes("claude")) {
      llm = new Claude(
        params.model,
        params.temperature,
        params.max_tokens,
        params.system_prompt,
      );
    } else {
      throw new Error(`invalid model: ${params.model}`);
    }
    const messages: Message[] = params.content !== undefined
      ? [{ role: Role.User, content: params.content }]
      : [];
    llm.ask(messages);
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}

main();
