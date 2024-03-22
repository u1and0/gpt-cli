" LLM AI Supported C-X Completion
if executable("gpt")
    function! GPT(system_prompt, max_tokens, ...) range
        " filetype &ft はGPTの実行先ファイルに応じて取得する
        " シングルクォートで囲まないと特殊文字をshellコマンドとして渡すときにエラー
        let lang_type = " Use language of " . &ft
        let system_prompt =  "'" . a:system_prompt . lang_type . ".'"

        " Get lines in the provided range
        " 引数においじてユーザープロンプトの取得方法を切り替え
        if a:0 == 0
            " 範囲指定がない場合は、現在のカーソル位置の行を使用
            let lines = getline(a:firstline, a:lastline)
        else
            " 範囲指定がある場合は、渡された'<,'>を使用する
            let lines = a:000
        endif
        let user_prompt =  "'" . join(lines, "\n") . "'"

        " Create  LLM API options
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
    " Create code continuously or Generate code to docs
    command! -nargs=0 -range GPTGenerateCode <line1>,<line2>call GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', 200)
    " Docs to code
    command! -nargs=0 -range GPTGenerateDocs <line1>,<line2>call GPT('あなたは最高のコードライターです。 与えられたコードに基づいてわかりやすい日本語のドキュメントを生成してください。', 1000)
    " Create test code
    command! -nargs=0 -range GPTGenerateTest <line1>,<line2>call GPT('You are the best code creator. Please write test code that covers all cases to try the given code.', 1000)
    " Any system prompt
    command! -nargs=1 -range GPTComplete '<,'>call GPT("You are best assistant.", 200, <q-args>)

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
