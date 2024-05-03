import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";

import { LLM } from "./lib/llm.ts";
import { getUserInputInMessage } from "./lib/input.ts";
import { parseArgs } from "./lib/parse.ts";

const VERSION = "v0.5.0r";
const helpMessage = `ChatGPT API client for chat on console
    Usage:
      $ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string OpenAI, Anthropic, Ollama model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, phi3, llama3:70b, mixtral:8x7b-text-v0.1-q5_K_M, default gpt-3.5-turbo)
      -x, --max-tokens: number Number of AI answer tokens (default 1000)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -u, --url: string URL and port number for ollama server (default http://localhost:11434)
      -s, --system-prompt: string The first instruction given to guide the AI model's response
      -n, --no-conversation: boolean   No conversation mode. Just one time question and answer.
    PROMPT:
      string A Questions for Model`;

const main = async () => {
  // Parse command argument
  const params = parseArgs();
  // console.debug(params);
  if (params.version) {
    console.error(`gpt ${VERSION}`);
    Deno.exit(0);
  }
  if (params.help) {
    console.error(helpMessage);
    Deno.exit(0);
  }

  // 引数に従ったLLMインスタンスを作成
  const llm = new LLM(params);
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
      // 最後のメッセージがHumanMessageではない場合
      // ユーザーからの問いを追加
      const humanMessage = await getUserInputInMessage(messages);
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

main();
