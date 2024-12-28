/*
このコードは、コマンドライン引数と標準入力を使用して、
LLM（Large Language Model）と対話するためのツールです。
ユーザーの入力を受け取り、LLMに質問を送信し、その回答を表示します。

また、スラッシュコマンドを使用して、コンテキストのクリア、ヘルプの表示、
プログラムの終了などの機能を提供します。

Usage:
$ deno run --allow-net --allow-env index.ts

Install:
$ deno install --allow-env --allow-net -n gpt gpt-cli.ts

Compile:
$ deno compile --allow-net --allow-env -o gpt index.ts

Run:
$ gpt
*/

import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";

import { commandMessage, helpMessage } from "./lib/help.ts";
import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage, readStdin } from "./lib/input.ts";
import { Params, parseArgs } from "./lib/params.ts";
import {
  Command,
  extractAtModel,
  handleSlashCommand,
  isAtCommand,
  isSlashCommand,
  modelStack,
} from "./lib/command.ts";

const VERSION = "v1.0.0";

/** 灰色のテキストで表示 */
function consoleInfoWithGrayText(s: string): void {
  console.info(`\x1b[90m${s}\x1b[0m`);
}

const llmAsk = async (params: Params) => {
  params.debug && console.debug(params);
  // 引数に従ったLLMインスタンスを作成
  let llm = new LLM(params);
  // コマンドライン引数systemPromptとcontentがあれば
  // システムプロンプトとユーザープロンプトを含めたMessageの生成
  let messages = [
    params.systemPrompt && new SystemMessage(params.systemPrompt),
    params.content && new HumanMessage(params.content),
  ].filter(Boolean) as Message[];

  try {
    // 一回限りの回答
    if (params.noChat) {
      await llm.query(messages);
      return;
    }

    // 対話的回答
    consoleInfoWithGrayText(commandMessage);
    while (true) {
      // ユーザーからの入力待ち
      let humanMessage: HumanMessage | Command = await getUserInputInMessage(
        messages,
      );

      // /commandを実行する
      if (isSlashCommand(humanMessage)) {
        messages = handleSlashCommand(humanMessage, messages);
        continue;
      } else if (isAtCommand(humanMessage)) {
        // @Model名で始まるinput はllmモデルを再指定する
        const { model, message } = extractAtModel(
          humanMessage.content.toString(),
        );
        // モデル名指定以外のプロンプトがなければ前のプロンプトを引き継ぐ。
        // 前のプロンプトもなければ空のHumanMessageを渡す
        humanMessage = message || messages.at(-2) || new HumanMessage("");

        // @コマンドで指定したモデルのパースに成功したら
        // モデルスタックに追加して新しいモデルで会話を始める。
        // パースに失敗したら、以前のモデルを復元してエラー表示して
        // 前のモデルに戻して会話を継続。
        if (model) {
          const modelBackup = params.model;
          params.model = model;
          try {
            llm = new LLM(params);
          } catch (error: unknown) {
            console.error(error);
            params.model = modelBackup;
            continue;
          }
          modelStack.push(model);
        }
      }

      // ユーザーからの問いを追加
      messages.push(humanMessage);
      // console.debug(messages);
      // AIからの回答を追加
      const aiMessage = await llm.ask(messages);
      if (!aiMessage) {
        throw new Error("LLM can not answer your question");
      }
      messages.push(aiMessage);
    }
  } catch (error) {
    console.error(error);
  }
};

const main = async () => {
  // コマンドライン引数をパースして
  const params: Params = parseArgs();
  // help, version flagが指定されていればinitで終了
  if (params.version) {
    console.error(`gpt ${VERSION}`);
    Deno.exit(0);
  }
  if (params.help) {
    console.error(helpMessage);
    Deno.exit(0);
  }

  // modelStackに使用した最初のモデルを追加
  modelStack.push(params.model);
  // 標準入力をチェック
  const stdinContent: string | null = await readStdin();
  if (stdinContent) {
    params.content = stdinContent;
    params.noChat = true; // 標準入力がある場合は対話モードに入らない
  }

  // llm へ質問し回答を得る。
  await llmAsk(params);
};

await main();
