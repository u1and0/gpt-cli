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

/** ユーザーの入力が@から始まると、@に続くモデル名を返す
 *  @param input {string} : ユーザーの入力
 *  @return {string} モデル名(@に続く文字列)
 */
export const extractAtModel = (input: string): string | undefined => {
  const match = input.match(/^@[^\s\n\t]+/);
  const modalName = match ? match[0].substring(1) : undefined;
  return modalName;
};
