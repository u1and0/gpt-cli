export const commandMessage = `
Ctrl+D to confirm input.

Help:
  /?, /help         Help for a command
  /clear            Clear session context
  /modelStack       Show model's history
  /bye,/exit,/quit  Exit
  @ModelName      Change LLM model
  ex)   @gemini-1.5-pro your question...
`;

export const helpMessage =
  `Command-line interface  that enables interactive chat with LLMs.

    Usage:
      $ gpt -m gpt-4o-mini -x 1000 -t 1.0 [OPTIONS] PROMPT

    Options:
      -v, --version: boolean   Show version
      -h, --help: boolean   Show this message
      -m, --model: string LLM model (default gpt-4o-mini)
      -x, --max-tokens: number Number of AI answer tokens (default 1000)
      -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
      -u, --url: string URL and port number for ollama server
      -s, --system-prompt: string The first instruction given to guide the AI model's response
      -n, --no-chat: boolean   No chat mode. Just one time question and answer.
    PROMPT:
      string A Questions for Model
    Models:
      - [OpenAI](https://platform.openai.com/docs/models)
        - gpt-4o-mini
        - gpt-4o
        - o1
        - o1-preview
        - o1-mini...
      - [Anthropic](https://docs.anthropic.com/claude/docs/models-overview)
        - claude-3-5-sonnet-20241022
        - claude-3-5-sonnet-latest
        - claude-3-opus-20240229
        - claude-3-haiku-20240307
        - claude-instant-1.2...
      - [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
        - gemini-1.5-pro-latest
        - gemini-2.0-flash-exp...
      - [Groq](https://console.groq.com/docs/models)
        - groq/llama3-groq-70b-8192-tool-use-preview
        - groq/llama-3.3-70b-specdec
        - groq/llama3.1-70b-specdec
        - groq/llama-3.2-1b-preview
        - groq/llama-3.2-3b-preview
      - [TogetherAI](https://api.together.ai/models)
        - togetherai/meta-llama/Llama-3.3-70B-Instruct-Turbo
        - togetherai/Qwen/QwQ-32B-Preview
        - togetherai/meta-llama/Llama-3.1-405B-Instruct-Turbo
        - togetherai/google/gemma-2-27b-it
        - togetherai/mistralai/Mistral-7B-Instruct-v0.3...
      - [Replicate](https://replicate.com/models)
        - replicate/meta/meta-llama-3-70b-instruct
        - replicate/meta/llama-2-7b-chat
        - replicate/mistralai/mistral-7b-instruct-v0.2
        - replicate/mistralai/mixtral-8x7b-instruct-v0.1
        - replicate/snowflake/snowflake-arctic-instruct
        - replicate/replicate/flan-t5-xl...
      - [Ollama](https://ollama.com/library)  ** Using before "$ ollama serve" locally **
        - ollama/phi3
        - ollama/llama3:70b
        - ollama/mixtral:8x7b-text-v0.1-q5_K_M...
${commandMessage}
`;
