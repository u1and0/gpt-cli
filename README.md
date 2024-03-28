<img src="https://img.shields.io/badge/version-v0.3.4-FF7777.svg"></img>
<img src="https://img.shields.io/badge/LICENSE-MIT-3388FF.svg"></img>
<img src="https://shield.deno.dev/deno/%5E1.39"></img>
<img src="https://github.com/u1and0/gpt-cli/actions/workflows/deno.yml/badge.svg"></img>

OpenAI and Anthropic API client for chat on console


# Quick start

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.3.4/gpt-cli.zip
$ unzip gpt-cli.zip
$ chmod 755 gpt
$ sudo ln -s ./gpt /usr/bin
$ gpt
Ctrl-D to confirm input, q or exit to end conversation
You: hi
...
gpt-3.5-turbo: Hello! How can I assist you today?
You:
```

However, the API key must be set to an environment variable in advance.


# Install

## Use runtime
Required [deno](https://docs.deno.com/runtime/manual/getting_started/installation)

Create link on your path like `~/.deno/bin` using `deno install`.

```
$ git clone https://github.com/u1and0/gpt-cli
$ cd gpt-cli
$ deno install -f --allow-net --allow-env --name gpt gpt-cli.ts
$ export PATH=$PATH:~/.deno/bin
$ bash -l
```

Or create binary by `deno compile`.

```
$ git clone https://github.com/u1and0/gpt-cli
$ cd gpt-cli
$ deno compile --allow-net --allow-env --no-check --output gpt gpt-cli.ts
$ chmod 755 ./gpt
$ sudo ln -s ./gpt /usr/bin
```


## Use binary

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.3.4/gpt-cli.zip
$ unzip gpt-cli.zip
$ chmod 755 gpt
$ sudo ln -s ./gpt /usr/bin
$ gpt -v
```


# Setup

## API keys
### OpenAI API

[Get OpenAI API key](https://platform.openai.com/api-keys), then set environment argument.

```
export OPENAI_API_KEY='sk-*****'
```

###  Anthropic API

[Get Anthropic API key](https://console.anthropic.com/login?returnTo=%2F), then set environment argument.

```
export ANTHROPIC_API_KEY='sk-ant-*****'
```


## Vim plugin

For example, if you want to manage plug-ins with dein, write a toml file like this

```toml
[[plugins]]
repo = 'u1and0/gpt-cli'
if = '''executable('gpt')'''
hook_add = '''
    command! -nargs=0 -range GPTGenerateCode <line1>,<line2>call gptcli#GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', { "max_tokens": 400, "temperature": 0.5, "model": "claude-3-haiku-20240307" })
    " Keybind C-X, C-G
    inoremap <C-x><C-g> <Esc>:GPTGenerateCode<CR>
    " Docs to code
    command! -nargs=0 -range GPTGenerateDocs <line1>,<line2>call gptcli#GPT('あなたは最高のコードライターです。 与えられたコードに基づいてわかりやすい日本語のドキュメントをコメントアウトして生成してください。', {"max_tokens": 2000, "model": "claude-3-haiku-20240307"})
    " Create test code
    command! -nargs=0 -range GPTGenerateTest <line1>,<line2>call gptcli#GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', { "temperature": 0.5, "model": "claude-3-haiku-20240307" })

    " Any system prompt
    command! -nargs=? -range GPTComplete <line1>,<line2>call gptcli#GPT(<q-args>, { "model": "claude-3-haiku-20240307" })
    " Conversate with GPT
    command! -nargs=? GPTConversate call gptcli#GPTWindow(<q-args>, {"model": "claude-3-sonnet-20240229" })
'''
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
