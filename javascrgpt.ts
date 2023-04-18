/* ChatGPT API client for chat on console
 * Usage:
 *  deno run --allow-net --allow-env javascrgpt.ts
 */
import Spinner from "https://deno.land/x/cli_spinners@v0.0.2/mod.ts";

const spinner = Spinner.getInstance();
spinner.interval = 100;
const frames = spinner.frames || [".", "..", "..."];
// ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const url = "https://api.openai.com/v1/chat/completions";
const apiKey = Deno.env.get("CHATGPT_API_KEY");
if (!apiKey) {
  throw new Error(`No token ${apiKey}`);
}

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

async function ask(messages: Message[] = []) {
  let input: string | null;
  while (true) { // inputがなければ再度要求
    input = prompt("あなた:");
    if (input === null) continue;
    if (input.trim() === "q" || input.trim() === "exit") {
      Deno.exit(0);
    } else if (input) {
      break;
    }
  }

  // userの質問をmessagesに追加
  messages.push({ role: Role.User, content: input });
  // POSTするデータを作成
  const data = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      max_tokens: 1000,
      temperature: 1.0,
      messages: messages,
    }),
  };
  // Load spinner
  let i = 0;
  const timer = setInterval(() => {
    i = ++i % frames.length;
    Deno.stdout.writeSync(new TextEncoder().encode("\r" + frames[i]));
  }, spinner.interval);

  // POST data to OpenAI API
  await fetch(url, data)
    .then((response) => {
      clearInterval(timer);
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
        return content;
      }
    })
    .then(print_one_by_one)
    .catch((error) => {
      throw new Error(`Fetch request failed: ${error}`);
    });
  ask(messages);
}

console.log("qまたはexitで終了します。");
ask();
