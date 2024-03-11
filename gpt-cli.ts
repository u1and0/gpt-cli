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

// import Anthropic from "npm:@anthropic-ai/sdk";

const VERSION = "v0.1.2";
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

const prompt = "You: ";
// Parse arg
type Params = {
  version: boolean;
  help: boolean;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
};
const args = parse(Deno.args);
const params: Params = {
  version: args.v || args.version || false,
  help: args.h || args.help || false,
  model: args.m || args.model || "gpt-3.5-turbo",
  max_tokens: parseInt(args.x || args.max_tokens) || 1000,
  temperature: parseFloat(args.t || args.temperature) || 1.0,
  system_prompt: args.s || args.system_prompt,
};
// console.debug(params);

enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
}
type Message = { role: Role; content: string };

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
export async function multiInput(ps: string): Promise<string> {
  const inputs: string[] = [];
  const decoder = new TextDecoder();
  const stdin = Deno.stdin;
  const buffer = new Uint8Array(100);
  // 同じ行にプロンプト表示
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

// ChatGPT へ対話形式に質問し、回答を得る
async function ask(messages: Message[] = []) {
  let input: string | null;
  while (true) { // inputがなければ再度要求
    input = await multiInput(prompt);
    if (input.trim() === null) continue;
    // q か exitが入力されたら正常終了
    if (input.trim() === "q" || input.trim() === "exit") {
      Deno.exit(0);
    } else if (input) {
      break;
    }
  }

  // Load spinner start
  const spinner = loadSpinner([".", "..", "..."], 100);

  // userの質問をmessagesに追加
  messages.push({ role: Role.User, content: input });
  // system promptをmessagesの最初に追加
  const hasSystemRole = messages.some(
    (message) => message.role === Role.System,
  );
  if (!hasSystemRole && params.system_prompt) {
    messages.unshift({ role: Role.System, content: params.system_prompt });
  }

  // POST data to OpenAI API
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }
  const openai = new OpenAI({ apiKey: apiKey });
  await openai.chat.completions.create({
    model: params.model,
    temperature: params.temperature,
    max_tokens: params.max_tokens,
    messages,
  })
    .then((response) => {
      clearInterval(spinner); // Load spinner stop
      return response;
    })
    // print1by1() の完了を待つために
    // async (data)として、print1by1()をawaitする
    .then(async (data) => {
      if (data.error) {
        console.error(data);
        throw new Error(data.error);
      }
      const content = data.choices[0].message.content;
      // assistantの回答をmessagesに追加
      messages.push({ role: Role.Assistant, content: content });
      // console.debug(messages);
      await print1by1(`\nAI: ${content}`);
    })
    .catch((error) => {
      throw new Error(`Fetch request failed: ${error}`);
    });
  await ask(messages);
}

function main() {
  if (params.version) {
    console.error(`gpt ${VERSION}`);
    Deno.exit(0);
  }
  if (params.help) {
    console.error(helpMessage);
    Deno.exit(0);
  }
  console.log("Ctrl-D to confirm input, q or exit to end conversation");
  ask();
}

main();
