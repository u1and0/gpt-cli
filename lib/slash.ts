import { helpMessage } from "./help.ts";
import { Message } from "./llm.ts";
export type _Command =
  | "/help"
  | "/?"
  | "/set"
  | "/clear"
  | "/bye";

export enum Command {
  Help = "HELP",
  Set = "SET",
  Clear = "CLEAR",
  Bye = "BYE",
}

// Commandに指定したいずれかの数値を返す
export const newSlashCommand = (input: string): Command | undefined => {
  const input0 = input.trim().split(/[\s\n\t]+/, 1)[0];
  const commandMap: Record<_Command, Command> = {
    "/help": Command.Help,
    "/?": Command.Help,
    "/set": Command.Set,
    "/clear": Command.Clear,
    "/bye": Command.Bye,
  };

  return commandMap[input0 as _Command];
};

// Command 型の型ガード
export const isCommand = (value: unknown): value is Command => {
  return Object.values(Command).includes(value as Command);
};
