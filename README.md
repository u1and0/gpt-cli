<img src="https://img.shields.io/badge/version-v0.9.0-FF7777.svg"></img>
<img src="https://img.shields.io/badge/LICENSE-MIT-3388FF.svg"></img>
<img src="https://shield.deno.dev/deno/%5E1.39"></img>
<img src="https://github.com/u1and0/gpt-cli/actions/workflows/deno.yml/badge.svg"></img>

Command-line interface  that enables interactive chat with LLMs.

![Peek 2024-03-30 20-03.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/a15731ab-c7a7-c242-28ed-8abc6252c565.gif)

# Quick start

```
# Install binary
$ bash -c "$(curl -fsSL https://raw.githubusercontent.com/u1and0/gpt-cli/refs/heads/main/install.sh)"
$ chmod 755 gpt
$ sudo ln -s ./gpt /usr/bin

# Setup API key
$ export OPENAI_API_KEY='sk-*****'

# Run
$ gpt
Ctrl-D to confirm input, q or exit to end chat
You: hi
...
gpt-4o-mini: Hello! How can I assist you today?
You:
```

However, the API key must be set to an environment variable in advance.

## Single mode (Not chat mode)

```
$ gpt -n "hi"
Hello! How can I assist you today?
```

## Use pipeline

```
$ echo "hi" | gpt
Hello! How can I assist you today?
```


# Installation
You have 3 options.

## Download binary
The simplest way.

```
$ bash -c "$(curl -fsSL https://raw.githubusercontent.com/u1and0/gpt-cli/refs/heads/main/install.sh)"
$ chmod 755 gpt
$ sudo ln -s ./gpt /usr/bin
$ gpt -v
```

Almost same command here.

```
$ curl -LO https://github.com/u1and0/gpt-cli/releases/download/v0.9.0/gpt-cli-linux.zip
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
$ deno compile --allow-net --allow-env --output gpt gpt-cli.ts
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

### Google API (for Gemini)

[Get Google API key](https://aistudio.google.com/app/apikey), then set environment argument.

```
export GOOGLE_API_KEY='*****'
```

### Groq API

[Get Groq API key](https://console.groq.com/keys), then set environment argument.

```
export GROQ_API_KEY='*****'
```

### Together AI API

[Get Together AI API key](https://api.together.xyz/settings/api-keys), then set environment argument.

```
export TOGETHER_AI_API_KEY='*****'
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
$ gpt -m gpt-4o-mini -x 8192 -t 1.0 [OPTIONS] PROMPT
```

## Options

| short option | long option | type | description |
|--------------|-------------|------|----|
| -v | --version | boolean | Show version |
| -h | --help | boolean | Show this message |
| -m | --model | string | LLM model (default gpt-4o-mini) |
| -x | --max\_tokens | number | Number of AI answer tokens (default 8192) |
| -t | --temperature | number | Higher number means more creative answers, lower number means more exact answers (default 1.0) |
| -u | --url | string | URL and port number for ollama server |
| -s | --system-prompt | string | The first instruction given to guide the AI model's response. |
| -n | --no-chat | boolean | No chat mode. Just one time question and answer. |


## PROMPT
A Questions for Model


## Models
- [OpenAI](https://platform.openai.com/docs/models)
    - gpt-4o-mini
    - gpt-4o
    - o1-mini
    - o1
    - o3-mini...
- [Anthropic](https://docs.anthropic.com/claude/docs/models-overview)
    - claude-3-5-sonnet-20241022
    - claude-3-5-sonnet-latest
    - claude-3-opus-20240229
    - claude-3-haiku-20240307
- [Gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
    - gemini-1.5-pro-latest
    - gemini-2.0-flash...
    - gemini-2.0-flash-thinking-exp...
- [Groq](https://console.groq.com/docs/models)
    - groq/llama3.1-70b-specdec
    - groq/llama-3.3-70b-specdec
    - groq/deepseek-r1-distill-qwen-32b
    - groq/deepseek-r1-distill-llama-70b
- [TogetherAI](https://api.together.ai/models)
    - togetherai/deepseek-ai/DeepSeek-R1
    - togetherai/deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
    - togetherai/meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
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

## / command
Help (/commands):

- /?, /help         Help for a command
- /clear            Clear session context
- /modelStack       Show model's history
- /bye,/exit,/quit  Exit

## @ command
Help (@commands): Change model while asking.

- @ModelName    Change LLM model
- ex)   @gemini-1.5-pro your question...

## Test

```
$ deno test --allow-env
```

See [gpt-cli/test](https://github.com/u1and0/gpt-cli/tree/main/test)

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
    command! -nargs=0 -range GPTGenerateCode <line1>,<line2>call gptcli#GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', { "max_tokens": 400, "temperature": 0.5,  "model": "gemini-1.5-pro-latest" })
    " Keybind C-X, C-G
    inoremap <C-x><C-g> <Esc>:GPTGenerateCode<CR>
    " Docs to code
    command! -nargs=0 -range GPTGenerateDocs <line1>,<line2>call gptcli#GPT('あなたの仕事は、提供されたコード スニペットを取り出し、シンプルでわかりやすい言葉で説明することです。コードの機能、目的、主要コンポーネントを分析します。最小限のコーディング知識を持つ人でも説明が理解できるように、例え話、例、わかりやすい用語を使用します。どうしても必要な場合を除き、専門用語の使用を避け、使用される専門用語については明確な説明を提供します。目標は、コードが何をするのか、そしてそれが高レベルでどのように機能するのかを読者が理解できるようにすることです。', {"max_tokens": 2000, "model": "gemini-1.5-pro-latest"})
    " Create test code
    command! -nargs=0 -range GPTGenerateTest <line1>,<line2>call gptcli#GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', { "temperature": 0.5, "model": "claude-3-haiku-20240307" })
    command! -nargs=0 -range GPTErrorBustor <line1>,<line2>call gptcli#GPT('Your task is to analyze the provided code snippet, identify any bugs or errors present, and provide a corrected version of the code that resolves these issues. Explain the problems you found in the original code and how your fixes address them. The corrected code should be functional, efficient, and adhere to best practices in programming.', {"temperature": 0.5, "model": "claude-3-sonnet-20240229"})
    command! -nargs=0 -range GPTCodeOptimizer <line1>,<line2>call gptcli#GPT("Your task is to analyze the provided code snippet and suggest improvements to optimize its performance. Identify areas where the code can be made more efficient, faster, or less resource-intensive. Provide specific suggestions for optimization, along with explanations of how these changes can enhance the code performance. The optimized code should maintain the same functionality as the original code while demonstrating improved efficiency.", { "model": "replicate/meta/meta-llama-3-70b-instruct" })

    " Any system prompt
    command! -nargs=? -range GPTComplete <line1>,<line2>call gptcli#GPT(<q-args>, { "model": "claude-3-haiku-20240307" })
    " Chat with GPT
    command! -nargs=? GPTChat call gptcli#GPTWindow(<q-args>, { "model": "ollama/phi3:instruct", "url": "http://localhost:11434"})
```

![Peek 2024-04-01 03-35.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/f243f19b-ee47-9821-5899-7ed2acc17320.gif)

By setting your own prompt in the GPT() function, the AI will return a one-shot document based on your own document with your own arrangements.

![Peek 2024-04-01 04-43.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113494/23286593-1418-d2cc-451a-e22efe7f3fa8.gif)

The GPTWindow() function allows you to open a terminal and interact with AI on Vim by putting a case-by-case system prompt in the command line.

[See more example](https://qiita.com/u1and0/items/88b86528ba5c8f9c3c87#vim-plugin1)
