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
    this.command = this.input.trim().split(" ")[0];
  }

  public toString(): string {
    switch (this.command) {
      case "/help":
      case "/?": {
        return helpMessage;
      }
      default: {
        return `invalid slash command ${this.command}`;
      }
    }
  }
}
