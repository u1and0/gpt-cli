import { HumanMessage } from "npm:@langchain/core/messages";

import { Message } from "./llm.ts";
import { Command, newSlashCommand } from "./slash.ts";

/** ユーザーの入力とシステムプロンプトをmessages内にセットする */
export async function getUserInputInMessage(
  messages: Message[],
): Promise<HumanMessage | Command | undefined> {
  // 最後のMessageがユーザーからのメッセージではない場合、
  // endlessInput()でユーザーからの質問を待ち受ける
  const lastMessage: Message | undefined = messages.at(-1);
  // console.debug(lastMessage);
  if (!(lastMessage instanceof HumanMessage)) {
    const input = await endlessInput();
    // / から始まる入力はコマンド解釈を試みる
    if (input.trim().startsWith("/")) {
      const cmd = newSlashCommand(input);
      if (cmd) return cmd;
    }
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

export async function readStdin(timeout: number): Promise<string | null> {
  if (Deno.isatty(Deno.stdin.rid)) {
    return null; // TTYの場合は標準入力を読み取らない
  }

  const decoder = new TextDecoder();
  let input = "";
  const buf = new Uint8Array(1024);

  while (true) {
    const { readable } = Deno.stdin;
    const readPromise = readable.read(buf);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout")),
        timeout,
      )
    );

    try {
      const readResult = await Promise.race([readPromise, timeoutPromise]);
      if (readResult === null) break;
      input += decoder.decode(buf.subarray(0, readResult));
    } catch (error) {
      if (error.messages === "Timeout") {
        break; // タイムアウトした場合はループを抜ける
      }
      throw error; // それ以外は再スロー
    }
  }

  return input.trim();
}
