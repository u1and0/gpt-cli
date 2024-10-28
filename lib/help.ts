export const commandMessage = `
    Help (/commands):
      /?, /help       Help for a command
      /clear          Clear session context
      /bye            Exit
`;

export const helpMessage =
  `Command-line interface  that enables interactive conversations with LLMs.

    Usage:
      $ gpt -m gpt-4o-mini -x 1000 -t 1.0 [OPTIONS] PROMPT
${commandMessage}
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
