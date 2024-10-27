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

export const Command = {
  Show: 0,
  Load: 1,
  Save: 2,
  Clear: 3,
  Bye: 4,
  Help: 5,
  Shortcuts: 6,
} as const;

export class SlashCommand {
  readonly command: Command;

  constructor(private readonly input: string) {
    const input0 = this.input.trim().split(/[\s\n\t]+/, 1)[0];
    switch (input0) {
      case "/help":
      case "/?": {
        this.command = Command.Help;
        break;
      }
      case "/clear": {
        // これまでのコンテキストをクリアする
        this.command = Command.Clear;
        break;
      }
      // コマンドの解釈に失敗してもエラーにしないで
      // 単に/から始まるプロンプトとする
      default: {
        console.error`invalid slash command ${this.command}`;
      }
    }
  }
}
