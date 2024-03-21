<img src="https://img.shields.io/badge/version-v0.3.2-FF7777.svg"></img>
<img src="https://img.shields.io/badge/LICENSE-MIT-3388FF.svg"></img>
<img src="https://shield.deno.dev/deno/%5E1.39"></img>
<img src="https://github.com/u1and0/gpt-cli/actions/workflows/deno.yml/badge.svg"></img>

OpenAI and Anthropic API client for chat on console

# Install

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.3.0/gpt-cli.zip
$ unzip gpt-cli.zip
$ chmod 755 gpt
$ ./gpt -v
```

# Usage

```
$ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT
```

## Options

* -v, --version: boolean   Show version
* -h, --help: boolean   Show this message
* -m, --model: string OpenAI or Anthropic model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, default gpt-3.5-turbo)
* -x, --max\_tokens: number Number of AI answer tokens (default 1000)
* -t, --temperature: number Higher number means more creative answers, lower number means more exact answers (default 1.0)
* -s, --system-prompt: string The first instruction given to guide the AI model's response`;
* -n, --no-conversation: boolean   No conversation mode. Just one time question and answer.

## PROMPT
A Questions for Model
