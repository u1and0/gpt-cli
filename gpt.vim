" LLM AI Supported C-X Completion
if executable("gpt")
    function! GPT(system_prompt, max_tokens) range
        " filetype &ft はGPTの実行先で取得する
        " シングルクォートで囲まないと特殊文字をshellコマンドとして渡すときにエラー
        let system_prompt =  "'" . a:system_prompt . " Use language of" . &ft . ".'"
        " Get lines in the provided range
        let lines = getline(a:firstline, a:lastline)
        let user_prompt =  "'" . join(lines) . "'"
        " Create system prompt and LLM API options
        let model =  "claude-3-haiku-20240307"
        " Build command
        let args = ["/usr/bin/gpt", "-m", model, "-n", "-x", a:max_tokens,  "-s", system_prompt, user_prompt]
        let cmd = join(args)
        echomsg cmd
        let result = systemlist(cmd)

        " Append the result below the last line and then delete the range
        call append(a:lastline, result)
    endfunction

    " :GPT*コマンドとして使用
    " Create code continuously
    command! -nargs=0 -range GPTComplete <line1>,<line2>call GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', 100)
    " Docs to code
    command! -nargs=0 -range GPTDocs <line1>,<line2>call GPT('あなたは最高のコードライターです。 与えられたコードに基づいてわかりやすい日本語のドキュメントを生成してください。', 1000)
    " Create test code
    " command! -nargs=0 -range GPTTest <line1>,<line2>call GPT(system_prompt)
    " Code to docs
    " command! -nargs=0 -range GPTCode <line1>,<line2>call GPT(system_prompt)

    " " カスタム補完関数 C-X, C-U
    " fun! CompleteByGPT(findstart, base)
    "     if a:findstart
    "         " 単語の始点を検索する
    "         let line = getline('.')
    "         let start = col('.') - 1
    "         while start > 0 && line[start - 1] =~ '\a'
    "             let start -= 1
    "         endwhile
    "         return start
    "     else
    "         " "a:base" にマッチする補完候補を探す
    "         let res = []
    "         result = GPT()
    "         let system_prompt = "'" . 'You are best of code generator. Generate a prompt to continue coding based on the given input code using language of ' . &ft . '.Genera te only code effectively, DO NOT generate code descriptions nor code blocks.' . "'"
    "         let model = "claude-3-haiku-20240307"
    "         let max_tokens = 30
    "         let args = ["/usr/bin/gpt", "-m", model, "-n", "-x", max_tokens, "-s", system_prompt, a:base]
    "         let cmd = join(args)
    "         let result = systemlist(cmd)
    "         call add(res, result)
    "         return res
    "     endif
    " endfun
    "
    " set completefunc=CompleteByGPT
endif
