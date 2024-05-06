<img src="https://img.shields.io/badge/version-v0.6.0-FF7777.svg"></img>
<img src="https://img.shields.io/badge/LICENSE-MIT-3388FF.svg"></img>
<img src="https://shield.deno.dev/deno/%5E1.39"></img>
<img src="https://github.com/u1and0/gpt-cli/actions/workflows/deno.yml/badge.svg"></img>

Command-line interface  that enables interactive conversations with LLMs.

![Peek 2024-03-30 20-03.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/a15731ab-c7a7-c242-28ed-8abc6252c565.gif)

# Quick start

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.6.0/gpt-cli-linux.zip
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
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.6.0/gpt-cli-linux.zip
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
### OpenAI API (for GPT)

[Get OpenAI API key](https://platform.openai.com/api-keys), then set environment argument.

```
export OPENAI_API_KEY='sk-*****'
```

### Anthropic API (for Claude)

[Get Anthropic API key](https://console.anthropic.com/login), then set environment argument.

```
export ANTHROPIC_API_KEY='sk-ant-*****'
```

### Goolgle API (for Gemini)

[Get Google API key](https://aistudio.google.com/app/apikey), then set environment argument.

```
export GOOGLE_API_KEY='*****'
```

### Replicate API (for Open Models)

[Get Replicate API token](https://replicate.com/account/api-tokens), then set environment argument.

```
export REPLICATE_API_TOKEN='*****'
```

### Setup Ollama (for Local running Models)
1. Setup Ollama, see [github.com/ollama/ollama](https://github.com/ollama/ollama)
1. Download ollama model such as `ollama pull modelName`
1. Start ollama `ollama serve` on your server.


# Usage

```
$ gpt -m gpt-3.5-turbo -x 1000 -t 1.0 [OPTIONS] PROMPT
```

## Options

| short option | long option | type | description |
|--------------|-------------|------|----|
| -v | --version | boolean | Show version |
| -h | --help | boolean | Show this message |
| -m | --model | string | OpenAI, Anthropic, Ollama, Replicate model (default gpt-3.5-turbo) |
| -x | --max\_tokens | number | Number of AI answer tokens (default 1000) |
| -t | --temperature | number | Higher number means more creative answers, lower number means more exact answers (default 1.0) |
| -u | --url | string | URL and port number for ollama server (default http://localhost:11434) |
| -s | --system-prompt | string | The first instruction given to guide the AI model's response. |
| -n | --no-conversation | boolean | No conversation mode. Just one time question and answer. |


## PROMPT
A Questions for Model


## Models
- [OpenAI](https://platform.openai.com/docs/models)
    - gpt-4-turbo
    - gpt-4-0125-preview
    - gpt-3.5-turbo...
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
    - mixtral:8x7b-text-v0.1-q5\_K\_M...

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
    command! -nargs=0 -range GPTErrorBustor <line1>,<line2>call gptcli#GPT('Your task is to analyze the provided code snippet, identify any bugs or errors present, and provide a corrected version of the code that resolves these issues. Explain the problems you found in the original code and how your fixes address them. The corrected code should be functional, efficient, and adhere to best practices in programming.', {"temperature": 0.5, "model": "claude-3-sonnet-20240229"})
    command! -nargs=0 -range GPTCodeOptimizer <line1>,<line2>call gptcli#GPT("Your task is to analyze the provided code snippet and suggest improvements to optimize its performance. Identify areas where the code can be made more efficient, faster, or less resource-intensive. Provide specific suggestions for optimization, along with explanations of how these changes can enhance the code performance. The optimized code should maintain the same functionality as the original code while demonstrating improved efficiency.", { "model": "meta/meta-llama-3-70b-chat" })

    " Any system prompt
    command! -nargs=? -range GPTComplete <line1>,<line2>call gptcli#GPT(<q-args>, { "model": "gemini-1.5-pro-latest" })
    " Conversate with Ollama phi3 model
    command! -nargs=? GPTConversate call gptcli#GPTWindow(<q-args>, { "model": "phi3:instruct", "url": "http://192.168.10.107:11434"})
'''
```

![Peek 2024-04-01 03-35.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/f243f19b-ee47-9821-5899-7ed2acc17320.gif)

By setting your own prompt in the GPT() function, the AI will return a one-shot document based on your own document with your own arrangements.

![Peek 2024-04-01 04-43.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/23286593-1418-d2cc-451a-e22efe7f3fa8.gif)

The GPTWindow() function allows you to open a terminal and interact with AI on Vim by putting a case-by-case system prompt in the command line.

[See more example](https://qiita.com/u1and0/items/88b86528ba5c8f9c3c87#vim-plugin1)
