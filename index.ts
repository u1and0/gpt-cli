import { HumanMessage, SystemMessage } from "npm:@langchain/core/messages";

import { LLM, Message } from "./lib/llm.ts";
import { getUserInputInMessage } from "./lib/input.ts";
import { parseArgs } from "./lib/parse.ts";

const VERSION = "v0.6.1";
const helpMessage =
  `Command-line interface  that enables interactive conversations with LLMs.
    Usage:
      $ gpt -m gpt-4o-mini -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string OpenAI, Anthropic, Google, Replicate, Ollama model (default gpt-4o-mini)
      -x, --max-tokens: number Number of AI answer tokens (default 1000)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -u, --url: string URL and port number for ollama server
      -s, --system-prompt: string The first instruction given to guide the AI model's response
      -n, --no-conversation: boolean   No conversation mode. Just one time question and answer.
    PROMPT:
      string A Questions for Model
    Models:
      - [OpenAI](https://platform.openai.com/docs/models)
        - gpt-4o-mini
        - gpt-4o...
      - [Anthropic](https://docs.anthropic.com/claude/docs/models-overview)
        - claude-3-opus-20240229
        - claude-3-haiku-20240307
        - claude-instant-1.2...
      - [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
        - gemini-1.5-pro-latest
        - gemini-pro
      - [Replicate](https://replicate.com/models)
        - meta/meta-llama-3-70b-instruct
        - meta/llama-2-7b-chat
        - mistralai/mistral-7b-instruct-v0.2
        - mistralai/mixtral-8x7b-instruct-v0.1
        - snowflake/snowflake-arctic-instruct
        - replicate/flan-t5-xl...
      - [Ollama](https://ollama.com/library)  ** Using before "$ ollama serve" locally **
        - phi3
        - llama3:70b
        - mixtral:8x7b-text-v0.1-q5_K_M...
`;

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
