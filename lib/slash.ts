import { helpMessage } from "./help.ts";
type Command =
  | "/help"
  | "/?"
  | "/show"
  | "/load"
  | "/save"
  | "/clear"
  | "/bye";

export class SlashCommand {
  private readonly command: Command | string;

  constructor(private readonly input: string) {
    console.log("input0:", this.input.trim().split(" ")[0]);
    console.log("input1:", this.input.trim().split(" ")[1]);
    this.command = this.input.trim().split(" ")[0];
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
