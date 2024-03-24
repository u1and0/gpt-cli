" LLM AI Supported C-X Completion
if executable("gpt")
    function! GPT(system_prompt,
                \ max_tokens=1000,
                \ temperature=1.0,
                \ model="claude-3-haiku-20240307",
                \ no_conversation=1,
                \ ) range
        " filetype &ft はGPTの実行先ファイルに応じて取得する
        " シングルクォートで囲まないと特殊文字をshellコマンドとして渡すときにエラー
        let lang_type = " Use language of " . &ft
        let l:system_prompt =  "'" . a:system_prompt . lang_type . ".'"

        " 範囲指定をuser_promptとして使う。
        " 範囲指定がない場合は、現在のカーソル位置の行を使用する。
        let lines = getline(a:firstline, a:lastline)
        let l:user_prompt =  "'" . join(lines, "\n") . "'"

        " Build command
        let args = ["/usr/bin/gpt",
                    \ "-m", a:model,
                    \ "-x", a:max_tokens,
                    \ "-t", a:temperature,
                    \ "-s", l:system_prompt]
        " no_conversationが指定されていれば "-n" をargsに追加
        if a:n > 0
            call add(args, "-n")
        endif
        " ユーザープロンプトを追加
        call add(args, l:user_prompt)
        let l:cmd = join(args)
        echomsg l:cmd

        " コマンドを実行して選択範囲の最終行以降に追加する。
        let l:result = systemlist(l:cmd)
        call append(a:lastline, l:result)
    endfunction

    function! GPTWindow(system_prompt,
                \ max_tokens=1000,
                \ temperature=1.0,
                \ model="claude-3-haiku-20240307")
        " gptを起動するコマンドを構築する
        let l:args = ["term", "gpt", 
                    \ "-x", a:max_tokens,
                    \ "-t", a:temperature,
                    \ "-m", a:model]
        " system_promptがあれば追加
        if a:system_prompt != ""
            call extend(l:args, [ "-s", a:system_prompt ])
        endif
        let l:cmd = join(args)
        echomsg l:cmd
        " 新しいバッファを開く
        execute "new"
         " ターミナルでGPTを起動
        execute cmd
        " call setline(1, l:user_prompt) " システムプロンプトを最初の行に設定
    endfunction


    " :GPT*コマンドとして使用
    " Create code continuously or Generate code to docs
    command! -nargs=0 -range GPTGenerateCode <line1>,<line2>call GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', 400, 0.5)
    " Keybind C-X, C-G
    inoremap <C-x><C-g> <Esc>:GPTGenerateCode<CR>
    " Docs to code
    command! -nargs=0 -range GPTGenerateDocs <line1>,<line2>call GPT('あなたは最高のコードライターです。 与えられたコードに基づいてわかりやすい日本語のドキュメントをコメントアウトして生成してください。', 2000)
    " Create test code
    command! -nargs=0 -range GPTGenerateTest <line1>,<line2>call GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', 1000, 0.5)
    " Any system prompt
    command! -nargs=1 -range GPTComplete <line1>,<line2>call GPT(<q-args>, 1000)
    " Conversate with GPT
    command! -nargs=? GPTConversate call GPTWindow(<q-args>)

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
