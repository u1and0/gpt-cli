import { HumanMessage } from "npm:@langchain/core/messages";
export type _Command =
  | "/help"
  | "/?"
  | "/clear"
  | "/bye";

export enum Command {
  Help = "HELP",
  Clear = "CLEAR",
  Bye = "BYE",
}

// Command 型の型ガード
export const isCommand = (value: unknown): value is Command => {
  return Object.values(Command).includes(value as Command);
};

// Commandに指定したいずれかの数値を返す
export const newSlashCommand = (input: string): Command | undefined => {
  const input0 = input.trim().split(/[\s\n\t]+/, 1)[0];
  const commandMap: Record<_Command, Command> = {
    "/help": Command.Help,
    "/?": Command.Help,
    "/clear": Command.Clear,
    "/bye": Command.Bye,
  };

  return commandMap[input0 as _Command];
};

type ModelMessage = { model?: string; message?: HumanMessage };

/** ユーザーの入力が@から始まると、@に続くモデル名を返す
 *  @param input {string} : ユーザーの入力
 *  @return {string} モデル名(@に続く文字列)
 */
export const extractAtModel = (input: string): ModelMessage => {
  const match = input.match(/^@[^\s\n\t]+/);
  const model = match ? match[0].substring(1) : undefined;
  // matchでマッチした@modelName を削除したinput を割り当てる
  const input1 = match ? input.substring(match[0].length).trim() : input;
  const message = input1 ? new HumanMessage(input1) : undefined;
  return { model, message };
};
