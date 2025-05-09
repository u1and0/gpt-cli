import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";
import type { BaseMessage } from "npm:@langchain/core/messages";

import { CommandLineInterface } from "./cli.ts";
import { filesGenerator, parseFileContent } from "./file.ts";

/** この会話で使用したLLM モデルの履歴 */
export const modelStack: Set<string> = new Set();

export type _Command =
  | "/help"
  | "/?"
  | "/clear"
  | "/modelStack"
  | "/bye"
  | "/exit"
  | "/quit"
  | "/file";

export enum Command {
  Help = "HELP",
  Clear = "CLEAR",
  ModelStack = "MODELSTACK",
  Bye = "BYE",
  File = "FILE",
}

// Command 型の型ガード
export const isSlashCommand = (value: unknown): value is Command => {
  if (typeof value === "object" && value !== null && "command" in value) {
    // { command: Command; path: string } の形式の場合は true
    return true;
  }
  return Object.values(Command).includes(value as Command);
};

// Commandに指定したいずれかの数値を返す
export const newSlashCommand = (
  input: string,
): Command | { command: Command; path: string } => {
  const inputParts = input.trim().split(/[\s\n\t]+/);
  const input0 = inputParts[0];
  const commandMap: Record<_Command, Command> = {
    "/help": Command.Help,
    "/?": Command.Help,
    "/clear": Command.Clear,
    "/modelStack": Command.ModelStack,
    "/bye": Command.Bye,
    "/exit": Command.Bye,
    "/quit": Command.Bye,
    "/file": Command.File,
  };
  const command = commandMap[input0 as _Command];
  if (!command) {
    throw new Error(`Invalid command. ${input0}`);
  }

  // Handle special cases for commands that need additional arguments
  if (command === Command.File && inputParts.length > 1) {
    return { command, path: inputParts[1] };
  }

  return command;
};

type ModelMessage = { model: string; message: string };

/** ユーザーの入力が@から始まると、@に続くモデル名を返す
 *  @param input {string} : ユーザーの入力
 *  @return {string} モデル名(@に続く文字列)
 */
export const extractAtModel = (input: string): ModelMessage => {
  const match = input.match(/^@[^\s\n\t]+/);
  const model = match ? match[0].substring(1) : "";
  // matchでマッチした@modelName を削除したinput を割り当てる
  const message = match ? input.substring(match[0].length).trim() : input;
  return { model, message };
};

export async function handleSlashCommand(
  commandInput: Command | { command: Command; path: string },
  messages: BaseMessage[],
): Promise<BaseMessage[]> {
  // Handle case where commandInput is a command object with path
  if (typeof commandInput === "object" && "command" in commandInput) {
    // Handle /file command
    if (commandInput.command === Command.File) {
      const filePattern = commandInput.path;
      try {
        // グレーアウトしたテキストを表示
        CommandLineInterface.printGray(
          `Attaching file(s) matching pattern: ${filePattern}...`,
        );

        // ファイルパターンを解釈して全てのマッチするファイルを処理
        let fileCount = 0;
        let allContent = "";

        for await (const filePath of filesGenerator([filePattern])) {
          try {
            const codeBlock = await parseFileContent(filePath);
            if (codeBlock.content) {
              // 各ファイルのコンテンツを追加
              allContent += `${codeBlock.toString()}\n\n`;
              fileCount++;
              CommandLineInterface.printGray(`Attached: ${filePath}`);
            }
          } catch (error) {
            CommandLineInterface.printGrayError(
              `Error processing file ${filePath}: ${error}`,
            );
          }
        }

        if (fileCount > 0) {
          // ファイルが1つ以上添付された場合
          const fileMessage = new HumanMessage(
            `Here are the file(s) I'm attaching (${fileCount} file(s)):\n${allContent.trim()}`,
          );
          messages.push(fileMessage);
          CommandLineInterface.printGray(
            `Successfully attached ${fileCount} file(s)`,
          );
        } else {
          CommandLineInterface.printGray(
            `No files found matching pattern: ${filePattern}`,
          );
        }
      } catch (error) {
        CommandLineInterface.printGrayError(
          `Error processing file pattern ${filePattern}: ${error}`,
        );
      }
      return messages;
    }

    // Extract just the command enum for other command types
    commandInput = commandInput.command;
  }

  // Handle standard commands
  switch (commandInput) {
    case Command.Help: {
      CommandLineInterface.showCommandMessage();
      break; // Slashコマンドを処理したら次のループへ
    }
    case Command.Clear: {
      console.log("Context clear successful");
      // SystemMessage 以外は捨てて新しい配列を返す
      return messages.filter((message: BaseMessage) => {
        if (message instanceof SystemMessage) {
          return message;
        }
      });
    }
    // 使用したモデルの履歴を表示する
    case Command.ModelStack: {
      console.log(`You were chat with them...\n${[...modelStack].join("\n")}`);
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

function getMessageFromHistory(
  messages: BaseMessage[],
  index: number = -2,
): string | null {
  return messages.length > Math.abs(index)
    ? messages[messages.length + index]?.content.toString()
    : null;
}

export function handleAtCommand(
  humanMessage: HumanMessage,
  messages: BaseMessage[],
  model: string,
): ModelMessage {
  if (!isAtCommand(humanMessage)) {
    return { message: humanMessage.content.toString(), model };
  }

  const extracted = extractAtModel(humanMessage.content.toString());

  // モデル名指定以外のプロンプトがなければ前のプロンプトを引き継ぐ。
  // 前のプロンプトもなければ空のHumanMessageを渡す
  const newMessage: string = extracted.message ||
    getMessageFromHistory(messages) ||
    "";

  return {
    message: newMessage,
    model: extracted.model || model,
  };
}
