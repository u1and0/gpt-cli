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
import { expandGlob, GlobIterator } from "https://deno.land/std/fs/mod.ts";

import { commandMessage, helpMessage } from "./lib/help.ts";
import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage, readStdin } from "./lib/input.ts";
import { Params, parseArgs } from "./lib/params.ts";
import { parseFileContent } from "./lib/file.ts";
import { CodeBlock } from "./lib/file.ts";
import {
  Command,
  extractAtModel,
  handleSlashCommand,
  isAtCommand,
  isSlashCommand,
  modelStack,
} from "./lib/command.ts";

const VERSION = "v0.9.1";

/** 灰色のテキストで表示 */
function consoleInfoWithGrayText(s: string): void {
  console.info(`\x1b[90m${s}\x1b[0m`);
}

class InitialMessage {
  constructor(readonly content: string) {}

  public add(codeBlock: CodeBlock) {
    return new InitialMessage(this.content + "\n" + codeBlock);
  }

  public getContent(): string {
    return this.content;
  }
}

// Helper function to check if a string is a glob pattern
function isGlobPattern(pattern: string) {
  // Simple check for common glob wildcards
  return /\*|\?|\[|\]/.test(pattern);
}

/** 与えられたパターンに応じてパスを返すジェネレーター
 * globパターンが含まれている場合:
 *  expandGlob()を使ってファイル名をyieldする
 * globパターンが含まれていない場合:
 *  patternをそのままyieldする
 */
async function* filesGenerator(patterns: string[]): AsyncGenerator<string> {
  for (const pattern of patterns) {
    if (!isGlobPattern(pattern)) {
      yield pattern;
    }
    const globIterator: GlobIterator = expandGlob(pattern); // 明示的に型指定
    for await (const filePath of globIterator) {
      yield filePath.path; // filePathはGlobEntry型なので、.pathでstringを取り出す
    }
  }
}

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
): Promise<{ llm: LLM; messages: Message[] } | undefined> {
  // ユーザーからの入力待ち
  let humanMessage: HumanMessage | Command = await getUserInputInMessage(
    messages,
  );

  // /commandを実行する
  if (isSlashCommand(humanMessage)) {
    messages = handleSlashCommand(humanMessage, messages);
    return;
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
        return;
      }
      modelStack.push(model);
    }
  }

  // ユーザーからの問いを追加
  messages.push(humanMessage as HumanMessage);
  // console.debug(messages);
  // AIからの回答を追加
  const aiMessage = await llm.ask(messages);
  if (!aiMessage) {
    throw new Error("LLM can not answer your question");
  }
  messages.push(aiMessage);

  return { llm, messages };
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
      const codeBlock = await parseFileContent(filePath);
      initialMessage = initialMessage.add(codeBlock);
    }
  }

  const initContent = initialMessage.getContent();
  let messages = [
    params.systemPrompt && new SystemMessage(params.systemPrompt),
    initContent && new HumanMessage(initContent),
  ].filter(Boolean) as Message[]; // truty のものだけ残す

  try {
    // 一回限りの回答
    if (params.noChat) {
      await llm.query(messages);
      return;
    }

    // 対話的回答
    consoleInfoWithGrayText(commandMessage);
    while (true) {
      const result = await userSession(llm, params, messages);
      if (result === undefined) continue;
      ({ llm, messages } = result);
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
