import { HumanMessage } from "npm:@langchain/core/messages";

import { Message } from "./llm.ts";
import { Command, newSlashCommand } from "./command.ts";

/** ユーザーの入力を返す
 * メッセージ配列から最後のユーザー入力を取得、もしくは新しいユーザー入力を待ち受ける
 *
 * - 最後のメッセージがユーザーからのものでない場合: ユーザーから新しい入力を取得
 *   - スラッシュコマンドの場合: Command オブジェクト
 *   - 通常のメッセージの場合: HumanMessage オブジェクト
 * - 最後のメッセージがユーザーからのものの場合: そのHumanMessageを返す
 *
 * @param {Message[]}: messages - 会話履歴のメッセージ配列
 * @returns {HumanMessage | Command} - ユーザーの入力、またはSlash Command
 */
export async function getUserInputInMessage(
  messages: Message[],
): Promise<HumanMessage | Command> {
  // 最後のMessageがユーザーからのメッセージではない場合、
  // endlessInput()でユーザーからの質問を待ち受ける
  const lastMessage: Message | undefined = messages.at(-1);
  // console.debug(lastMessage);
  if (lastMessage instanceof HumanMessage) {
    return lastMessage;
  }
  // 入力が何かあるまで入力を施す
  const input: string = await endlessInput();

  // / から始まらなければ、ユーザーの入力として返す
  if (!input.trim().startsWith("/")) {
    return new HumanMessage(input);
  }

  // / から始まる入力はコマンド解釈を試みる
  try {
    const cmd = newSlashCommand(input);
    return cmd;
  } catch {
    // Invalid command errorの場合は、
    // /を含めてHumanMessageとして返す
    return new HumanMessage(input);
  }
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
