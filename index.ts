/*
Usage:
$ deno run --allow-net --allow-env index.ts
*/

import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";

import { commandMessage, helpMessage } from "./lib/help.ts";
import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage } from "./lib/input.ts";
import { Params, parseArgs } from "./lib/parse.ts";
import { Command, extractAtModel, isCommand } from "./lib/slash.ts";

const VERSION = "v0.6.1r";

const llmAsk = async (params: Params) => {
  // 引数に従ったLLMインスタンスを作成
  let llm = new LLM(params);
  // コマンドライン引数systemPromptとcontentがあれば
  // システムプロンプトとユーザープロンプトを含めたMessageの生成
  const messages = [
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
        switch (humanMessage) {
          case Command.Help: {
            console.log(commandMessage);
            break;
          }
          case Command.Clear: {
            messages.splice(0, messages.length); // clear context
            console.log("Context clear successful");
            break;
          }
          case Command.Bye: {
            Deno.exit(0);
          }
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
  const params = parseArgs();
  // help, version flagが指定されていればinitで終了
  if (params.version) {
    console.error(`gpt ${VERSION}`);
    Deno.exit(0);
  }
  if (params.help) {
    console.error(helpMessage);
    Deno.exit(0);
  }
  // llm へ質問し回答を得る。
  await llmAsk(params);
};

await main();
