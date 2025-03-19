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
import { ChatOpenAI } from "npm:@langchain/openai";

import { CommandLineInterface } from "./lib/cli.ts";
import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage, readStdin } from "./lib/input.ts";
import { Params } from "./lib/params.ts";
import { filesGenerator, parseFileContent } from "./lib/file.ts";
import { CodeBlock } from "./lib/file.ts";
import {
  handleAtCommand,
  handleSlashCommand,
  isAtCommand,
  isSlashCommand,
  modelStack,
} from "./lib/command.ts";

const VERSION = "v0.9.2r";

export class InitialMessage {
  constructor(private readonly content: string) {}

  public add(codeBlock: CodeBlock) {
    return new InitialMessage(
      `${this.content}
${codeBlock}`,
    );
  }

  public getContent(): string {
    return this.content;
  }
}

type AgentRecord = { llm: LLM; messages: Message[] };

/** ユーザーからの入力により実行を分岐する
 * while loop内の処理
 * @param {LLM} llm - AIのインスタンス
 * @param {Params} params - コマンドラインパラメータ
 * @param {Message[]} messages - User | AI | System message
 * @returns {Promise<{ llm: LLM; messages: Message[] } | undefined>}
 * @throws {Error} - LLM can not answer your question
 */
async function userSession(
  llm: LLM,
  params: Params,
  messages: Message[],
): Promise<AgentRecord | undefined> {
  try {
    // ユーザーからの入力待ち
    let humanMessage = await getUserInputInMessage(
      messages,
    );

    // /commandを実行する
    if (isSlashCommand(humanMessage)) {
      messages = await handleSlashCommand(humanMessage, messages);
      return { llm, messages };
    }

    // @Model名で始まるinput はllmモデルを再指定する
    if (isAtCommand(humanMessage)) {
      const extractedAtModelMessage = handleAtCommand(
        humanMessage as HumanMessage,
        messages,
        params.model,
      );

      // @コマンドで指定したモデルのパースに成功したら
      // モデルスタックに追加して新しいモデルで会話を始める。
      // パースに失敗したら、以前のモデルを復元してエラー表示して
      // 前のモデルに戻して会話を継続。
      if (extractedAtModelMessage.model) {
        const modelBackup = params.model;
        params.model = extractedAtModelMessage.model;
        try {
          llm = new LLM(params);
        } catch (error: unknown) {
          console.error(error);
          params.model = modelBackup;
          return;
        }
        modelStack.add(extractedAtModelMessage.model);
      }
      humanMessage = new HumanMessage(extractedAtModelMessage.message);
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

    return { llm, messages };
  } catch (error) {
    console.error("Error in userSession:", error);
    return { llm, messages };
  }
}

const llmAsk = async (params: Params) => {
  params.debug && console.debug(params);
  // 引数に従ったLLMインスタンスを作成
  let llm = new LLM(params);
  // コマンドライン引数systemPromptとcontentがあれば
  // システムプロンプトとユーザープロンプトを含めたMessageの生成
  // params.content があった場合は、コンテンツからメッセージを作成
  let initialMessage = new InitialMessage(params.content || "");

  // params.files が1つ以上あれば、readFileした内容をinitialMessageに追加
  // params.files のstring[]と、
  // expandGlobのパターンのiteratorを合わせて
  // forループに渡す
  if (params.files && params.files.length > 0) {
    for await (const filePath of filesGenerator(params.files)) {
      // 指定されたすべてのファイルをテキストにパースして
      // 最初のユーザープロンプトに含める
      try {
        const codeBlock = await parseFileContent(filePath);
        if (!codeBlock.content) continue;
        initialMessage = initialMessage.add(codeBlock);
      } catch (error) {
        // エラーを表示するのみ。終了しない
        console.error("Error: parse file content:", error);
      }
    }
  }

  const initContent = initialMessage.getContent();
  let messages = [
    params.systemPrompt && new SystemMessage(params.systemPrompt),
    initContent && new HumanMessage(initContent),
  ].filter(Boolean) as Message[]; // truty のものだけ残す

  try {
    // --no-chat または --jsonが指定された場合
    // 一回限りの回答
    if (params.noChat || params.json) {
      await llm.query(messages);
      return;
    }

    // if (params.json) {
    //   if (!(llm.transrator instanceof ChatOpenAI)) {
    //     return;
    //   }
    //   // const jsonSchemaString = `{
    //   //   "name": "カタログ",
    //   //   "descripttion": "カタログテスト",
    //   //   "parameters": {
    //   //     "name": "商品名",
    //   //     "type": "object",
    //   //     "properties": {
    //   //       "price":{
    //   //         "type": "number",
    //   //         "description": "価格"
    //   //       },
    //   //       "features": {
    //   //         "type": "array",
    //   //         "descripttion": "特徴"
    //   //       },
    //   //       "colors": {
    //   //         "type": "array",
    //   //         "descripttion": "色"
    //   //       },
    //   //       "stock_status": {
    //   //         "type": "string",
    //   //         "descripttion": "在庫状況"
    //   //       }
    //   //     },
    //   //     "required": [
    //   //       "price",
    //   //       "features",
    //   //       "colors"
    //   //     ]
    //   //   }
    //   // }`;
    //   // const jsonSchema = JSON.parse(jsonSchemaString);
    //   // console.debug("jsonSchema: ", jsonSchema);
    //
    //   // const llmStructured = llm.transrator.withStructuredOutput(jsonSchema);
    //
    //   const llmStructured = llm.transrator.bind({
    //     response_format: { type: "json_object" },
    //   });
    //   // await llm.query(messages);
    //   const result = await llmStructured.invoke(initContent);
    //   console.log(result);
    //   return;
    // }

    // 対話的回答
    CommandLineInterface.showCommandMessage();
    while (true) {
      const result = await userSession(llm, params, messages);
      if (result === undefined) continue;
      params.debug && console.debug(result.messages);
      ({ llm, messages } = result);
    }
  } catch (error) {
    console.error(error);
  }
};

const main = async () => {
  const cli = CommandLineInterface.getInstance();
  // help, version flagが指定されていればinitで終了
  if (cli.params.version) {
    CommandLineInterface.showVersion(VERSION);
    Deno.exit(0);
  }
  if (cli.params.help) {
    CommandLineInterface.showHelp();
    Deno.exit(0);
  }

  // modelStackに使用した最初のモデルを追加
  modelStack.add(cli.params.model);
  // 標準入力をチェック
  const stdinContent: string | null = await readStdin();
  if (stdinContent) {
    cli.params.content = stdinContent;
    cli.params.noChat = true; // 標準入力がある場合は対話モードに入らない
  }

  // llm へ質問し回答を得る。
  await llmAsk(cli.params);
};

await main();
