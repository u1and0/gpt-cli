import { Params, parseArgs } from "./params.ts";

const commandMessage = `
Ctrl+D to confirm input.

Help:
  /?, /help         Help for a command
  /clear            Clear session context
  /file             Attach readable text file
  /modelStack       Show model's history
  /bye,/exit,/quit  Exit
  @ModelName      Change LLM model
  ex)   @gemini-2.0-flash your question...
`;

const shortHelpMessage =
  `Command-line interface  that enables interactive chat with LLMs.

    Usage:
      $ gpt -m gpt-4.1-mini -x 32768 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string LLM model (default gpt-4.1-mini)
      -x, --max-tokens: number Number of AI answer tokens (default 32768)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -u, --url: string URL and port number for ollama server (defaults to http://localhost:11434, can also be set with OLLAMA_URL environment variable) [DEPRECATED]
      -s, --system-prompt: string The first instruction given to guide the AI model's response
      -f, --file: string  Attachment file path.
      -n, --no-chat: boolean   No chat mode. Just one time question and answer.
    -o, --timeout: number    Timeout in seconds for waiting for the AI response (default 30)
`;

const longHelpMessage = `${shortHelpMessage}
    PROMPT:
      string A Questions for Model
    Models:
      - [OpenAI](https://platform.openai.com/docs/models)
          - gpt-4.1
          - gpt-4.1-mini
          - gpt-4o
          - gpt-4o-mini
          - o4-mini
          - o3...
      - [Anthropic](https://docs.anthropic.com/claude/docs/models-overview)
          - claude-opus-4-0
          - claude-sonnet-4-0
          - claude-3-7-sonnet-latest
          - claude-3-5-sonnet-20241022
          - claude-3-5-sonnet-latest...
      - [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
          - gemini-2.5-pro-preview-05-06
          - gemini-2.5-flash-preview-05-20
          - gemini-2.0-flash
          - gemini-2.0-flash-lite...
      - [Gemma](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)
          - gemma-3n-e4b-it
          - gemma-3-27b-it...
      - [Grok](https://docs.x.ai/docs/models)
          - grok-3-latest
          - grok-2-latest
          - grok-2-1212
      - [Groq](https://console.groq.com/docs/models)
          - groq/meta-llama/llama-4-maverick-17b-128e-instruct
          - groq/meta-llama/llama-4-scout-17b-16e-instruct
          - groq/deepseek-r1-distill-qwen-32b
          - groq/deepseek-r1-distill-llama-70b...
      - [TogetherAI](https://api.together.ai/models)
          - togetherai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8
          - togetherai/deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
          - togetherai/meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
          - togetherai/Qwen/QwQ-32B-Preview
          - togetherai/google/gemma-2-27b-it
          - togetherai/mistralai/Mistral-7B-Instruct-v0.3...
      - [Fireworks](https://fireworks.ai/models)
          - fireworks/accounts/fireworks/models/qwen3-235b-a22b
          - fireworks/accounts/fireworks/models/deepseek-r1
          - fireworks/accounts/fireworks/models/deepseek-v3...
      - [MistralAI](https://docs.mistral.ai/getting-started/models/models_overview/)
          - mistralai/codestral-latest
          - mistralai/mistral-large-latest
          - mistralai/mistral-small-latest
      - [Replicate](https://replicate.com/models)
          - replicate/deepseek-ai/deepseek-r1
          - replicate/meta/meta-llama-3-70b-instruct
          - replicate/mistralai/mixtral-8x7b-instruct-v0.1
          - replicate/snowflake/snowflake-arctic-instruct
          - replicate/replicate/flan-t5-xl...
      - [Hugginface](https://huggingface.co/models)
          - huggingface/meta-llama/Llama-3.1-8b-Instruct
      - [Ollama](https://ollama.com/library)  **Use before \`$ ollama serve\` locally**
          - ollama/phi4
          - ollama/llama3.3:70b
          - ollama/mixtral:8x7b-text-v0.1-q5_K_M...
      ${commandMessage}
`;

export class CommandLineInterface {
  private static _instance: CommandLineInterface;
  public readonly params: Params;

  private constructor() {
    // コマンドライン引数をパースして
    // cli.paramsプロパティを作成する
    this.params = parseArgs();
  }

  public static getInstance(): CommandLineInterface {
    if (!CommandLineInterface._instance) {
      CommandLineInterface._instance = new CommandLineInterface();
    }
    return CommandLineInterface._instance;
  }

  public static showVersion(version: string): void {
    console.log(`gpt ${version}`);
  }

  public static showShortHelp(): void {
    console.log(shortHelpMessage);
  }

  public static showLongHelp(): void {
    console.log(longHelpMessage);
  }

  // 定数
  private static readonly GRAY_COLOR_CODE = "\x1b[90m";
  private static readonly RESET_COLOR_CODE = "\x1b[0m";

  /** コマンドヘルプを灰色のテキストで表示 */
  public static showCommandMessage(): void {
    CommandLineInterface.printGray(commandMessage);
  }

  /** テキストをグレーアウトして表示 */
  public static printGray(text: string): void {
    console.info(
      `${CommandLineInterface.GRAY_COLOR_CODE}${text}${CommandLineInterface.RESET_COLOR_CODE}`,
    );
  }

  /** エラーメッセージをグレーアウトして表示 */
  public static printGrayError(text: string): void {
    console.error(
      `${CommandLineInterface.GRAY_COLOR_CODE}${text}${CommandLineInterface.RESET_COLOR_CODE}`,
    );
  }
}
