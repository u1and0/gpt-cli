ChatGPT API client for chat on console

# Install

```
$ git clone https://github.com/u1and0/javascrgpt.git
$ cd javascrgpt
$ deno install --allow-net --allow-env javascrgpt.ts
```

# Usage

```
$ javascrgpt [OPTION]
```

# Options

```
-v, --version: boolean   Show version
-h, --help: boolean   Show this message
-m, --model: string   OpenAIモデル (default gpt-3.5-turbo)
-x, --max_tokens: number    AIの回答トークン数 (default 1000)
-t, --temperature: number   数字が大きいほど創造的な答えになり、小さいほど厳密な答えになる (default 1.0)
--system_prompt: string   AIモデルの反応を導くために与えられる最初の指示`;
```
