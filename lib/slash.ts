import { helpMessage } from "./help.ts";
import { Message } from "./llm.ts";
export type _Command =
  | "/help"
  | "/?"
  | "/show"
  | "/load"
  | "/save"
  | "/clear"
  | "/bye";

export enum Command {
  Show = "SHOW",
  Load = "LOAD",
  Save = "SAVE",
  Clear = "CLEAR",
  Bye = "BYE",
  Help = "HELP",
  Shortcuts = "SHORTCUTS",
}

// Commandに指定したいずれかの数値を返す
export const newSlashCommand = (input: string): Command | undefined => {
  const input0 = input.trim().split(/[\s\n\t]+/, 1)[0];
  const commandMap: Record<_Command, Command> = {
    "/help": Command.Help,
    "/?": Command.Help,
    "/show": Command.Show,
    "/load": Command.Load,
    "/save": Command.Save,
    "/clear": Command.Clear,
    "/bye": Command.Bye,
  };

  return commandMap[input0 as _Command];
};

// Command 型の型ガード
export const isCommand = (value: unknown): value is Command => {
  return Object.values(Command).includes(value as Command);
};
