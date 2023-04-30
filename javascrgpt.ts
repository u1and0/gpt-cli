/* ChatGPT API client for chat on console
 * Usage:
 *  deno run --allow-net --allow-env javascrgpt.ts
 */
import Spinner from "https://deno.land/x/cli_spinners@v0.0.2/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

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
// Load spinner setting
const spinner = Spinner.getInstance();
spinner.interval = 100;
const frames = [".", "..", "..."];

enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
}
type Message = { role: Role; content: string };

function print_one_by_one(str: string): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const intervalId = setInterval(() => {
      Deno.stdout.writeSync(new TextEncoder().encode(str[i]));
      i++;
      if (i === str.length) {
        clearInterval(intervalId);
        Deno.stdout.writeSync(new TextEncoder().encode("\n"));
        resolve();
      }
    }, 20);
  });
}

async function multiInput(): string {
  const ps = "あなた: ";
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
    input = await multiInput();
    if (input.trim() === null) continue;
    if (input.trim() === "q" || input.trim() === "exit") {
      Deno.exit(0);
    } else if (input) {
      break;
    }
  }

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

  // Load spinner
  let i = 0;
  const timer = setInterval(() => {
    i = ++i % frames.length;
    Deno.stdout.writeSync(new TextEncoder().encode("\r" + frames[i]));
  }, spinner.interval);

  // POST data to OpenAI API
  const url = "https://api.openai.com/v1/chat/completions";
  await fetch(url, data)
    .then((response) => {
      clearInterval(timer); // Stop spinner
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
        return `\nChatGPT: ${content}`;
      }
    })
    .then(print_one_by_one)
    .catch((error) => {
      throw new Error(`Fetch request failed: ${error}`);
    });
  ask(messages);
}

/* MAIN */
console.log("Ctrl+Dで入力確定, qまたはexitで会話終了");
ask();
