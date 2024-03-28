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

const VERSION = "v0.3.4";
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

// Parse arg
type Params = {
  version: boolean;
  help: boolean;
  no_conversation: boolean;
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

interface LLM {
  agent: (messages: Message[]) => Promise<void>;
  ask(messages: Message[]): Promise<void>;
  query(messages: Message[]): Promise<string>;
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
    private readonly max_tokens: number,
    private readonly system_prompt?: string,
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
        max_tokens: this.max_tokens,
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
    if (!hasSystemRole && this.system_prompt) {
      messages.unshift({ role: Role.System, content: this.system_prompt });
    }
    return messages;
  }

  /** ChatGPT へ一回限りの質問をし、回答を出力して終了する */
  public async query(messages: Message[]): Promise<string> {
    if (this.system_prompt) {
      messages = this.pushSustemPrompt(messages);
    }
    const resp = await this.agent(messages);
    const content = this.getContent(resp);
    return content;
  }

  /** ChatGPT へ対話形式に質問し、回答を得る */
  public async ask(messages: Message[]) {
    messages = await setUserInputInMessage(messages);
    if (this.system_prompt) {
      messages = this.pushSustemPrompt(messages);
    }
    const spinnerID = spinner.start();
    // POST data to OpenAI API
    const resp = await this.agent(messages);
    spinner.stop(spinnerID);
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
    private readonly max_tokens: number,
    private readonly system_prompt?: string,
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
        max_tokens: this.max_tokens,
        system: this.system_prompt, // GPTと違ってsystem promptはsystemに入れる
        messages,
      });
    };
  }

  public getContent(data: Response): string {
    return data.content[0].text;
  }

  /** Claude へ一回限りの質問をし、回答を出力して終了する */
  public async query(messages: Message[]): Promise<string> {
    const resp = await this.agent(messages);
    const content = this.getContent(resp);
    return content;
  }

  /** Claude へ対話形式に質問し、回答を得る */
  public async ask(messages: Message[]) {
    messages = await setUserInputInMessage(messages); // GPTと違ってsystem promptはmessagesにいれない
    const spinnerID = spinner.start();
    // POST data to Anthropic API
    const resp = await this.agent(messages);
    spinner.stop(spinnerID);
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
  const args = parse(Deno.args, {
    boolean: ["v", "version", "h", "help", "n", "no-conversation"],
    string: ["m", "model", "s", "system-prompt", "content"],
    number: ["v", "temperature", "x", "max-tokens"],
    default: {
      temperature: 1.0,
      "max-tokens": 1000,
    },
  });
  // args.content = args._.length > 0 ? args._.join(" ") : undefined; // 残りの引数をすべてスペースで結合
  const params = {
    version: args.v || args.version || false,
    help: args.h || args.help || false,
    no_conversation: args.n || args["no-conversation"] || false,
    model: args.m || args.model || "gpt-3.5-turbo",
    max_tokens: parseInt(args.x || args["max-tokens"]) || 1000,
    temperature: parseFloat(args.t || args.temperature) || 1.0,
    system_prompt: args.s || args["systemPrompt"],
    content: args._.length > 0 ? args._.join(" ") : undefined, // 残りの引数をすべてスペースで結合
  };
  return params;
}

function createLLM(params: Params): LLM {
  if (params.model.startsWith("gpt")) {
    return new GPT(
      params.model,
      params.temperature,
      params.max_tokens,
      params.system_prompt,
    );
  } else if (params.model.startsWith("claude")) {
    return new Claude(
      params.model,
      params.temperature,
      params.max_tokens,
      params.system_prompt,
    );
  } else {
    throw new Error(`invalid model: ${params.model}`);
  }
}

async function main() {
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
  // create LLM モデルの作成
  const llm = createLLM(params);
  const messages: Message[] = params.content !== undefined
    ? [{ role: Role.User, content: params.content }]
    : [];
  // query LLM 一回限りの応答
  if (params.no_conversation) {
    const content = await llm.query(messages);
    console.log(content);
    return;
  }
  // ask LLM 対話的応答
  console.log("Ctrl-D to confirm input, q or exit to end conversation");
  llm.ask(messages);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  Deno.exit(1);
}
