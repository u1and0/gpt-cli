" LLM AI Supported C-X Completion
function! gptcli#GPT(system_prompt,
            \ model="gpt-3.5-turbo",
            \ max_tokens=1000,
            \ temperature=1.0) range
    " filetype &ft はGPTの実行先ファイルに応じて取得する
    " シングルクォートで囲まないと特殊文字をshellコマンドとして渡すときにエラー
    let lang_type = " Use language of " . &ft
    let l:system_prompt =  "'" . a:system_prompt . lang_type . ".'"

    " 範囲指定をuser_promptとして使う。
    " 範囲指定がない場合は、現在のカーソル位置の行を使用する。
    let lines = getline(a:firstline, a:lastline)
    let l:user_prompt =  "'" . join(lines, "\n") . "'"

    " Build command
    let args = ["/usr/bin/gpt", "-n",
                \ "-m", a:model,
                \ "-x", a:max_tokens,
                \ "-t", a:temperature,
                \ "-s", l:system_prompt]
    " ユーザープロンプトを追加
    call add(args, l:user_prompt)
    let l:cmd = join(args)
    echo l:cmd

    " コマンドを実行して選択範囲の最終行以降に追加する。
    let l:result = systemlist(l:cmd)
    call append(a:lastline, l:result)
endfunction

function! gptcli#GPTWindow(system_prompt,
            \ model="gpt-3.5-turbo",
            \ max_tokens=1000,
            \ temperature=1.0)
    " gptを起動するコマンドを構築する
    " 新しいWindowでterminalでgptコマンドを実行する
    let l:gpt = ["gpt", "-x", a:max_tokens, "-t", a:temperature, "-m", a:model]
    " system_promptがあれば追加
    if a:system_prompt != ""
        call extend(l:gpt, [ "-s", a:system_prompt ])
    endif
    echo join(l:gpt)
    " gptコマンドを新しいウィンドウで実行する
    let l:cmd = ["new", "|", "term"]
    call extend(l:cmd, l:gpt)
    execute join(l:cmd)
    " call setline(1, l:user_prompt) " システムプロンプトを最初の行に設定
endfunction

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
