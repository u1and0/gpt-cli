ChatGPT API client for chat on console

# Install

```
$ git clone https://github.com/u1and0/gpt-cli.git
$ cd gpt-cli
$ deno install --allow-net --allow-env gpt-cli.ts
```

# Usage

```
$ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTION] PROMPT
```

## Options

```
-v, --version: boolean   Show version
-h, --help: boolean   Show this message
-m, --model: string OpenAI model (default gpt-3.5-turbo)
-x, --max_tokens: number Number of AI answer tokens (default 1000)
-t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
-s, --system-prompt: string The first instruction given to guide the AI model's response`;
```

## PROMPT
A Questions for Model
