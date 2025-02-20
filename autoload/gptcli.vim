" LLM AI Supported C-X Completion

" Usage
" call gptcli#GPT("your system prompt")
" call gptcli#GPT("your system prompt", {model="gpt-3.5-turbo", max_tokens=1000, temperature=1.0})
" 上に挙げたkwargsはgptのデフォルト値なので指定しなければこの値でgptが実行される。
function! gptcli#GPT(system_prompt, kwargs={}) range
            " \ max_tokens=1000,
            " \ temperature=1.0,
            " \ model="gpt-3.5-turbo") range
    " filetype &ft はGPTの実行先ファイルに応じて取得する
    " シングルクォートで囲まないと特殊文字をshellコマンドとして渡すときにエラー
    let l:args = ["gpt", "-n"]
    if a:system_prompt != ""
        if &ft != ""
            let syntax = " Use syntax of " . &ft
            let l:system_prompt =  "'" . a:system_prompt . l:syntax .  ".'"
        else
            let l:system_prompt = "'" . a:system_prompt .  ".'"
        endif
        call add(l:args, "-s")
        call add(l:args, l:system_prompt)
    endif

    " オプションの追加

    if has_key(a:kwargs, "model")  " default gpt-3.5-turbo
        call add(l:args, "-m")
        call add(l:args, a:kwargs["model"])
    endif

    if has_key(a:kwargs, "max_tokens")  " default 1000
        call add(l:args, "-x")
        call add(l:args, a:kwargs["max_tokens"])
    endif

    if has_key(a:kwargs, "temperature")  " default 1.0
        call add(l:args, "-t")
        call add(l:args, a:kwargs["temperature"])
    endif

    if has_key(a:kwargs, "url")  " default http://localhost:11434
        call add(l:args, "-u")
        call add(l:args, a:kwargs["url"])
    endif

    if has_key(a:kwargs, "file")
        call add(l:args, "-f")
        call add(l:args, a:kwargs["file"])
    endif

    " echom  l:args  " Debug print

    " 範囲指定をuser_promptとして使う。
    " 範囲指定がない場合は、現在のカーソル位置の行を使用する。
    let lines = getline(a:firstline, a:lastline)
    let l:user_prompt =  "'" . join(lines, "\n") . "'"
    " ユーザープロンプトを追加
    call add(l:args, l:user_prompt)
    let l:cmd = join(l:args)
    echo l:cmd

    " コマンドを実行して選択範囲の最終行以降に追加する。
    let l:result = systemlist(l:cmd)
    " echom l:result  " Debug print
    call append(a:lastline, l:result)
endfunction


" コマンドを定義
" Usage:
"   command! -nargs=* GPTChat call s:GPTChatFunction(<q-args>)
function! gptcli#GPTWindow(args, kwargs={})
    " argsの解析
    " システムプロンプトかファイルか分岐する
    let l:system_prompt = ""
    let l:file_list = []
    for arg in a:args
      " ファイルとして読み込めるかどうかでファイルパスを判断
      let l:file_path = expand(arg)
      if filereadable(l:file_path)
          call extend(l:file_list, ["-f", l:file_path])
      else
        let l:system_prompt .= arg
      endif
    endfor
    " echo "System Prompt: " . l:system_prompt
    " echo "File Path: " . string(l:file_list)

    " gptを起動するコマンドを構築する
    let l:gpt_command = ["gpt"]
    " system_promptがあれば追加
    if l:system_prompt != ""
        call extend(l:gpt_command , [ "-s", l:system_prompt ])
    endif

    if l:file_list != []
        call extend(l:gpt_command , file_list)
    endif

    " kwargsの解析
    if has_key(a:kwargs, "model")
        call add(l:gpt_command , "-m")
        call add(l:gpt_command , a:kwargs["model"])
    endif

    if has_key(a:kwargs, "max_tokens")
        call add(l:gpt_command , "-x")
        call add(l:gpt_command , a:kwargs["max_tokens"])
    endif

    if has_key(a:kwargs, "temperature")
        call add(l:gpt_command , "-t")
        call add(l:gpt_command , a:kwargs["temperature"])
    endif

    if has_key(a:kwargs, "url")  " default http://localhost:11434
        call add(l:gpt_command , "-u")
        call add(l:gpt_command , a:kwargs["url"])
    endif

    echo join(l:gpt_command )
    " 新しいWindowでterminalでgptコマンドを実行する
    let l:cmd = ["new", "|", "term"]
    call extend(l:cmd, l:gpt_command )
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
