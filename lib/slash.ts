import { helpMessage } from "./help.ts";
export type Command =
  | "/help"
  | "/?"
  | "/show"
  | "/load"
  | "/save"
  | "/clear"
  | "/bye";

export class SlashCommand {
  readonly command: Command | string;

  constructor(private readonly input: string) {
    this.command = this.input.trim().split(/[\s\n\t]+/, 1)[0];
  }

  public exec(): string {
    switch (this.command) {
      case "/help":
      case "/?": {
        return helpMessage;
      }
      case "/clear": {
        // これまでのコンテキストをクリアする
        // messages = []
        return "Context clear.";
      }
      default: {
        return `invalid slash command ${this.command}`;
      }
    }
  }
}
