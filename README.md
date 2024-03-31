<img src="https://img.shields.io/badge/version-v0.3.4-FF7777.svg"></img>
<img src="https://img.shields.io/badge/LICENSE-MIT-3388FF.svg"></img>
<img src="https://shield.deno.dev/deno/%5E1.39"></img>
<img src="https://github.com/u1and0/gpt-cli/actions/workflows/deno.yml/badge.svg"></img>

A command-line interface (CLI) that enables interactive conversations with AI models.

![Peek 2024-03-30 20-03.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/a15731ab-c7a7-c242-28ed-8abc6252c565.gif)

# Quick start

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.3.4/gpt-cli-linux.zip
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


# Installation
You have 3 options.

## Download binary
The simplest way.

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.3.4/gpt-cli-linux.zip
$ unzip gpt-cli-linux.zip
$ chmod 755 gpt
$ sudo ln -s ./gpt /usr/bin
$ gpt -v
```

gpt-cli-macos.zip and gpt-cli-windows.zip are also available.
Try to switch zip file name.


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


## Compile from source
Required [deno](https://docs.deno.com/runtime/manual/getting_started/installation)

Create binary by `deno compile`.

```
$ git clone https://github.com/u1and0/gpt-cli
$ cd gpt-cli
$ deno compile --allow-net --allow-env --no-check --output gpt gpt-cli.ts
$ chmod 755 ./gpt
$ sudo ln -s ./gpt /usr/bin
```


# Setup

## API keys
### OpenAI API (GPT)

[Get OpenAI API key](https://platform.openai.com/api-keys), then set environment argument.

```
export OPENAI_API_KEY='sk-*****'
```

### Anthropic API (Claude)

[Get Anthropic API key](https://console.anthropic.com/login), then set environment argument.

```
export ANTHROPIC_API_KEY='sk-ant-*****'
```

# Usage

```
$ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT
```

## Options

| short option | long option | type | description |
|--------------|-------------|------|----|
| -v | --version | boolean | Show version |
| -h | --help | boolean | Show this message |
| -m | --model | string | OpenAI or Anthropic model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, default gpt-3.5-turbo) |
| -x | --max\_tokens | number | Number of AI answer tokens (default 1000) |
| -t | --temperature | number | Higher number means more creative answers, lower number means more exact answers (default 1.0) |
| -s | --system-prompt | string | The first instruction given to guide the AI model's response. |
| -n | --no-conversation | boolan | No conversation mode. Just one time question and answer. |

## PROMPT
A Questions for Model


# Vim plugin (Optional)
This is a Vimmer-only option.
This option brings a Github Copilot-like experience to your Vim.

![Peek 2024-03-30 11-05.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/5c19c1f2-cecf-59df-c6ff-6dc2c364feca.gif)

For example, if you want to manage plug-ins with dein, write a toml file like this.

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

![Peek 2024-04-01 03-35.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/f243f19b-ee47-9821-5899-7ed2acc17320.gif)

By setting your own prompt in the GPT() function, the AI will return a one-shot document based on your own document with your own arrangements.

![Peek 2024-04-01 04-43.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/23286593-1418-d2cc-451a-e22efe7f3fa8.gif)

The GPTWindow() function allows you to open a terminal and interact with AI on Vim by putting a case-by-case system prompt in the command line.

| short option | long option | type | description |
|--------------|-------------|------|----|
| -v | --version | boolean | Show version |
| -h | --help | boolean | Show this message |
| -m | --model | string OpenAI or Anthropic model (gpt-4, claude-instant-1.2, claude-3-opus-20240229, claude-3-haiku-20240307, default gpt-3.5-turbo) |
| -x | --max\_tokens | number | Number of AI answer tokens (default 1000) |
| -t | --temperature | number | Higher number means more creative answers, lower number means more exact answers (default 1.0) |
| -s | --system-prompt | string | The first instruction given to guide the AI model's response. |
| -n | --no-conversation | boolean | No conversation mode. Just one time question and answer. |

[See more example](https://qiita.com/u1and0/items/88b86528ba5c8f9c3c87#vim-plugin1)
