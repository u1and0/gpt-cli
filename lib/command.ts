import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";
import { commandMessage } from "./help.ts";
import { LLM, Message } from "./llm.ts";
import { Params } from "./params.ts";

/** この会話で使用したLLM モデルの履歴 */
export const modelStack: string[] = [];

export type _Command =
  | "/help"
  | "/?"
  | "/clear"
  | "/modelStack"
  | "/bye"
  | "/exit"
  | "/quit";

export enum Command {
  Help = "HELP",
  Clear = "CLEAR",
  ModelStack = "MODELSTACK",
  Bye = "BYE",
}

// Command 型の型ガード
export const isSlashCommand = (value: unknown): value is Command => {
  return Object.values(Command).includes(value as Command);
};

// Commandに指定したいずれかの数値を返す
export const newSlashCommand = (input: string): Command => {
  const input0 = input.trim().split(/[\s\n\t]+/, 1)[0];
  const commandMap: Record<_Command, Command> = {
    "/help": Command.Help,
    "/?": Command.Help,
    "/clear": Command.Clear,
    "/modelStack": Command.ModelStack,
    "/bye": Command.Bye,
    "/exit": Command.Bye,
    "/quit": Command.Bye,
  };
  const command = commandMap[input0 as _Command];
  if (!command) {
    throw new Error(`Invalid command. ${input0}`);
  }
  return command;
};

type ModelMessage = { model?: string; message?: HumanMessage };

/** ユーザーの入力が@から始まると、@に続くモデル名を返す
 *  @param input {string} : ユーザーの入力
 *  @return {string} モデル名(@に続く文字列)
 */
const extractAtModel = (input: string): ModelMessage => {
  const match = input.match(/^@[^\s\n\t]+/);
  const model = match ? match[0].substring(1) : undefined;
  // matchでマッチした@modelName を削除したinput を割り当てる
  const input1 = match ? input.substring(match[0].length).trim() : input;
  const message = input1 ? new HumanMessage(input1) : undefined;
  return { model, message };
};

export function handleSlashCommand(
  command: Command,
  messages: Message[],
): Message[] {
  switch (command) {
    case Command.Help: {
      console.log(commandMessage);
      break; // Slashコマンドを処理したら次のループへ
    }
    case Command.Clear: {
      console.log("Context clear successful");
      // SystemMessage 以外は捨てて新しい配列を返す
      return messages.filter((message: Message) => {
        if (message instanceof SystemMessage) {
          return message;
        }
      });
    }
    // 使用したモデルの履歴を表示する
    case Command.ModelStack: {
      console.log(`You were chat with them...\n${modelStack.join("\n")}`);
      break;
    }
    case Command.Bye: {
      Deno.exit(0);
    }
  }
  // messagesをそのまま返す
  return messages;
}

/** @が最初につく場合を判定 */
export const isAtCommand = (humanMessage: unknown): boolean => {
  if (!(humanMessage instanceof HumanMessage)) {
    return false;
  }
  const content = humanMessage.content.toString();
  if (!content) {
    return false;
  }
  return content.startsWith("@");
};

export function handleAtCommandFlow(
  params: Params,
  humanMessage: HumanMessage,
  messages: Message[],
): ModelMessage | undefined {
  // @Model名で始まるinput はllmモデルを再指定する
  const { model, message } = extractAtModel(
    humanMessage.content.toString(),
  );
  if (!model) return;

  // @コマンドで指定したモデルのパースに成功したら
  // モデルスタックに追加して新しいモデルで会話を始める。
  // パースに失敗したら、以前のモデルを復元してエラー表示して
  // 前のモデルに戻して会話を継続。
  const modelBackup = params.model;
  try {
    // LLMのインスタンス化で
    // 存在しないモデルはエラーが発生する
    const newLLM = new LLM(params);
    params.model = model;
    modelStack.push(model);
    return { model: newLLM, message };
  } catch (error: unknown) {
    console.error(error);
    params.model = modelBackup;
  }
}
