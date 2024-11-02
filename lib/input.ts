import { HumanMessage } from "npm:@langchain/core/messages";

import { Message } from "./llm.ts";
import { Command, newSlashCommand } from "./command.ts";

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

/** Ctrl+D が押された後の文字列が空行だったら再度標準入力を求める */
async function endlessInput(): Promise<string> {
  let input: string | null;
  while (true) {
    input = await multiInput();
    // Ctrl+D が押された後の文字列が空行でなければreturn
    if (input.trim()) return input;
  }
}

/** Ctrl+Dが押されるまでユーザーの入力を求める。
Ctrl+Dで入力が確定されたらこれまでの入力を結合して文字列として返す。
*/
async function multiInput(): Promise<string> {
  const inputs: string[] = [];
  const ps = "You: ";

  const decoder = new TextDecoder();
  const stdin = Deno.stdin;
  const buffer = new Uint8Array(100);
  // 同じ行にプロンプト表示
  Deno.stdout.writeSync(new TextEncoder().encode(ps));

  while (true) {
    const n = await stdin.read(buffer);
    // バッファなし = Ctrl+Dの入力は入力受付を中断する
    if (n === null) {
      break;
    }
    const input = decoder.decode(buffer.subarray(0, n)).trim();
    // 空行は無視して入力受付を継続する
    if (input === "") {
      continue;
    }
    inputs.push(input);
  }
  return inputs.join("\n");
}

export async function readStdin(): Promise<string | null> {
  if (Deno.stdin.isTerminal()) {
    return null; // TTYの場合は標準入力を読み取らない
  }

  const decoder = new TextDecoder();
  let input = "";
  const buffer = new Uint8Array(1024);

  while (true) {
    const readResult = await Deno.stdin.read(buffer);
    if (readResult === null) break;
    input += decoder.decode(buffer.subarray(0, readResult));
  }

  return input.trim();
}
