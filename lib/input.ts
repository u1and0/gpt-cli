import { readLines } from "https://deno.land/std/io/mod.ts";
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
  const ps = "You: ";

  if (Deno.stdin.isTerminal()) {
    // Chat Mode
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
  } else {
    for await (const line of readLines(Deno.stdin)) {
      // パイプ入力の場合
      inputs.push(line);
    }
  }

  return inputs.join("\n");
}

export async function readStdin(timeout: number): Promise<string | null> {
  if (Deno.stdin.isTerminal()) {
    return null; // TTYの場合は標準入力を読み取らない
  }

  const decoder = new TextDecoder();
  let input = "";

  try {
    const reader = Deno.stdin.readable.getReader();
    const timer = setTimeout(() => reader.cancel(), timeout);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      input += decoder.decode(value);
    }

    clearTimeout(timer);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // タイムアウトによるくアンセル
      console.error("Timeout");
    } else {
      throw error; // それ以外は再スロー
    }
  }

  return input.trim();
}
