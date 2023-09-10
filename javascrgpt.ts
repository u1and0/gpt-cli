/* ChatGPT API client for chat on console
 * Usage:
 *  deno run --allow-net --allow-env javascrgpt.ts
 */
import { parse } from "https://deno.land/std/flags/mod.ts";

const you = "あなた: ";
const apiKey = Deno.env.get("OPENAI_API_KEY");
if (!apiKey) {
  throw new Error(`No token ${apiKey}`);
}
// Parse arg
type Params = {
  model: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
};
const args = parse(Deno.args);
const params: Params = {
  model: args.m || args.model || "gpt-3.5-turbo",
  temperature: parseFloat(args.t || args.temperature) || 1.0,
  max_tokens: parseInt(args.x || args.max_tokens) || 1000,
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
function loadSpinner(frames: string[], interval: number): number {
  let i = 0;
  return setInterval(() => {
    i = ++i % frames.length;
    Deno.stdout.writeSync(new TextEncoder().encode("\r" + frames[i]));
  }, interval);
}

// 渡された文字列を1文字ずつ20msecごとにターミナルに表示する
function print1by1(str: string): Promise<void> {
  str += "\n";
  return new Promise((resolve) => {
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
async function multiInput(ps: string): Promise<string> {
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

async function ask(messages: Message[] = []) {
  let input: string | null;
  while (true) { // inputがなければ再度要求
    input = await multiInput(you);
    if (input.trim() === null) continue;
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
  // POSTするデータを作成
  const data = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      messages: messages,
    }),
  };
  // console.debug(data);

  // POST data to OpenAI API
  const url = "https://api.openai.com/v1/chat/completions";
  await fetch(url, data)
    .then((response) => {
      clearInterval(spinner); // Load spinner stop
      if (!response.ok) {
        console.error(response);
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        console.error(data);
      } else {
        const content = data.choices[0].message.content;
        // assistantの回答をmessagesに追加
        messages.push({ role: Role.Assistant, content: content });
        // console.debug(messages);
        print1by1(`\nChatGPT: ${content}\n${you}`);
      }
    })
    .catch((error) => {
      throw new Error(`Fetch request failed: ${error}`);
    });
  ask(messages);
}

/* MAIN */
console.log("Ctrl+Dで入力確定, qまたはexitで会話終了");
ask();
