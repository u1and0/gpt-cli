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
$ gpt -
*/

import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";

import { helpMessage } from "./lib/help.ts";
import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage, readStdin } from "./lib/input.ts";
import { Params, parseArgs } from "./lib/parse.ts";
import {
  extractAtModel,
  isCommand,
  slashCommandAction,
} from "./lib/command.ts";

const VERSION = "v0.6.2r";

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
    if (params.noConversation) {
      await llm.query(messages);
      return;
    }

    // 対話的回答
    while (true) {
      // ユーザーからの入力待ち
      let humanMessage = await getUserInputInMessage(messages);

      if (isCommand(humanMessage)) {
        // コンテキストクリア
        const act: Message[] | undefined = slashCommandAction(
          humanMessage,
          params.systemPrompt,
        );
        if (act !== undefined) {
          messages = act;
        }
        continue; // Slashコマンドを処理したら次のループへ
      } else if (humanMessage?.content.toString().startsWith("@")) {
        // @Model名で始まるinput はllmモデルを再指定する
        const { model, message } = extractAtModel(
          humanMessage.content.toString(),
        );
        // モデル名指定以外のプロンプトがなければ前のプロンプトを引き継ぐ。
        humanMessage = message ? message : messages.at(-2);
        if (model) {
          params.model = model;
          llm = new LLM(params);
        }
      }

      // 最後のメッセージがHumanMessageではない場合
      // ユーザーからの問いを追加
      if (humanMessage) {
        messages.push(humanMessage);
      }
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

  // 標準入力をチェック
  const stdinContent = await readStdin(10);
  if (stdinContent) {
    params.content = stdinContent;
    // params.noConversation = true; // 標準入力がある場合は対話モードに入らない
  }

  // llm へ質問し回答を得る。
  await llmAsk(params);
};

await main();
