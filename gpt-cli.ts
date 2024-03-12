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

const VERSION = "v0.2.0";
const helpMessage = `ChatGPT API client for chat on console
    Usage:
      $ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string OpenAI model (default gpt-3.5-turbo)
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
  system_prompt: string;
};

enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
}
type Message = { role: Role; content: string };

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
  error?: string;
};

interface LLMInterface {
  ask(messages: Message[]): Promise<void>;
  getContent(data: Response): string;
}

/** ユーザーの入力とシステムプロンプトをmessages内にセットする */
async function setUserInputInMessage(
  messages: Message[],
  systemPrompt?: string,
): Promise<Message[]> {
  const input = await endlessInput();
  // userの質問をmessagesに追加
  messages.push({ role: Role.User, content: input });
  // system promptをmessagesの最初に追加
  const hasSystemRole = messages.some(
    (message) => message.role === Role.System,
  );
  if (!hasSystemRole && systemPrompt) {
    messages.unshift({ role: Role.System, content: systemPrompt });
  }
  return messages;
}

abstract class LLM {
  // public readonly ps: string;
  // public readonly completions: OpenAI.Completions | Anthropic.Messages;
  constructor(
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly systemPrompt?: string,
  ) {}

  abstract getContent(data: Response): string;

  /** ChatGPT へ対話形式に質問し、回答を得る */
  public async ask(messages: Message[] = []) {
    messages = await setUserInputInMessage(messages, this.systemPrompt);
    // Load spinner start
    const spinner = loadSpinner([".", "..", "..."], 100);

    // POST data to OpenAI API
    const completions = this.getCompletions();
    await completions?.create({
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      messages,
    })
      // print1by1() の完了を待つために
      // async (data)として、print1by1()をawaitする
      .then(async (response: Response) => {
        clearInterval(spinner); // Load spinner stop
        if (response.error) {
          console.error(response);
          throw new Error(response.error);
        }
        const content = this.getContent(response);
        // assistantの回答をmessagesに追加
        messages.push({ role: Role.Assistant, content: content });
        // console.debug(messages);
        await print1by1(`\n${this.model}: ${content}`);
      })
      .catch((error: Response) => {
        throw new Error(`Fetch request failed: ${error}`);
      });
    await this.ask(messages);
  }
}

class GPT extends LLM implements LLMInterface {
  private completions: OpenAI.Completions;

  constructor(
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly systemPrompt?: string,
  ) {
    super(model, temperature, maxTokens, systemPrompt);
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set.");
    }
    const openai = new OpenAI({ apiKey });
    this.completions = openai.chat.completions as OpenAI.Completions;
  }

  private getCompletions(): OpenAI.Completions {
    return this.completions;
  }

  public getContent(data: Response): string {
    return data.choices[0].message.content;
  }
}

class Claude extends LLM implements LLMInterface {
  private completions: Anthropic.Messages;

  constructor(
    private readonly model: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly systemPrompt?: string,
  ) {
    super(model, temperature, maxTokens, systemPrompt);
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
    }
    const anthropic = new Anthropic({ apiKey });
    this.completions = anthropic.messages;
  }

  private getCompletions(): Anthropic.Messages {
    return this.completions;
  }

  public getContent(data: Response): string {
    return data.content[0].text;
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
  try {
    if (params.model.includes("gpt")) {
      const gpt = new GPT(
        params.model,
        params.temperature,
        params.max_tokens,
        params.system_prompt,
      );
      gpt.ask();
    } else if (params.model.includes("claude")) {
      const claude = new Claude(
        params.model,
        params.temperature,
        params.max_tokens,
        params.system_prompt,
      );
      claude.ask();
    } else {
      throw new Error(`invalid model: ${params.model}`);
    }
  } catch (error) {
    console.error(error.message);
    Deno.exit(1);
  }
}

main();
