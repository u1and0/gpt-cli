" LLM AI Supported C-X Completion

" Usage
" call gptcli#GPT("your system prompt")
" call gptcli#GPT("your system prompt", {model="gpt-4o-mini", max_tokens=8192, temperature=1.0})
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
" Setting:
"   command! -nargs=* GPTChat call s:GPTWindow(<f-args>, {'model':'gpt-4o'})
"
" Usage:
"   1. exモードから使う
"
"   システムプロンプトを指定する
"   `:GPTChat 関西弁で話して`
"
"   単一のファイルを指定する
"   `:GPTChat %`
"
"   複数のファイルを指定する
"   `:GPTChat % ~/your/any.txt `
"
"   globパターンを指定する
"   `:GPTChat ./lib/*.ts
"
"   システムプロンプトとファイルパスを組み合わせる
"   `:GPTChat % # ~/your/any.txt 関西弁で話して`
"   `:GPTChat  関西弁で話して % # ~/your/any.txt``
"
"   結果として、
"   gptコマンドにカレントバッファ、裏バッファ、~/your/any.txtを-fオプションで指定して、
"   '関西弁で話して'というシステムプロンプトを送ります。
"   システムプロンプトとファイルパスの区別は`filereadable()`で判定します。
"   システムプロンプトの位置はどこでもかいまいませんが、
"   filereadable() の結果がfalseのものは、system_prompt_listに入れられて
"   最終的に一つのシステムプロンプトとして結合されてgptコマンドに渡されるため
"   意図しないシステムプロンプトを構築してしまう可能性があります。
"
"   2. On-The-Fly にパラメータを決定しながら指定する
"
"   キーワード引数は辞書形式で指定できます。
"
"   ただし、command!で設定したコマンドは使えないため、
"   `call gptcli#GPTWindow()`から使ってください。
"
"   ```
"   :call gptcli#GPTWindow(
"       '関西弁で話して',
"       '%',
"       {
"           'model': 'gemini-2.0-flash',
"           'temperature': 0.3,
"       })
"   ```
function! gptcli#GPTWindow(...)
    " argsの解析
    " Handle arguments passed to the function
    let l:args = copy(a:000)  " Copy the arguments to a mutable list

    " Extract the kwargs (dictionary) if it exists as the last argument
    let l:kwargs = {}
    if len(l:args) > 0 && type(l:args[-1]) == v:t_dict
        let l:kwargs = remove(l:args, -1)  " Remove and get the last argument
    endif


    " システムプロンプトかファイルか分岐する
    let [l:file_list, l:system_prompt] = gptcli#_GetFileList(args)
    echom "System Prompt: " . string(l:system_prompt)
    echom "File Path: " . string(l:file_list)

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
    if has_key(l:kwargs, "model")
        call add(l:gpt_command , "-m")
        call add(l:gpt_command , l:kwargs["model"])
    endif

    if has_key(l:kwargs, "max_tokens")
        call add(l:gpt_command , "-x")
        call add(l:gpt_command , l:kwargs["max_tokens"])
    endif

    if has_key(l:kwargs, "temperature")
        call add(l:gpt_command , "-t")
        call add(l:gpt_command , l:kwargs["temperature"])
    endif

    if has_key(l:kwargs, "url")  " default http://localhost:11434
        call add(l:gpt_command , "-u")
        call add(l:gpt_command , l:kwargs["url"])
    endif

    echo join(l:gpt_command )
    " 新しいWindowでterminalでgptコマンドを実行する
    let l:cmd = ["new", "|", "term"]
    call extend(l:cmd, l:gpt_command )
    execute join(l:cmd)
    " call setline(1, l:user_prompt) " システムプロンプトを最初の行に設定
endfunction

" 与えられた引数argsを、ファイルのリストかプロンプトのリストへ振り分け、
" ファイルのリストには、k'-f' をつけてファイルオプションとする
" プロンプトのリストは、k半角スペースで結合してシステムプロンプトとする。
function! gptcli#_GetFileList(args)
    " 引数をファイルパスとシステムプロンプトに分類する関数群を使用
    let l:classification = s:ClassifyArguments(a:args)
    " ファイルリストを構築
    let l:file_list = s:BuildFileList(l:classification.files)
    " システムプロンプトを結合
    let l:system_prompt = join(l:classification.prompts, ' ')
    return [l:file_list, l:system_prompt]
endfunction

" 引数を分類する関数
function! s:ClassifyArguments(args)
    let l:result = {
        \ 'files': [],
        \ 'prompts': []
        \ }

    for arg in a:args
        call s:ClassifySingleArgument(arg, l:result)
    endfor

    return l:result
endfunction

" 単一の引数を分類する関数
function! s:ClassifySingleArgument(arg, result)
    " 特別な変数（##）の場合は展開
    if a:arg ==# '##'
        let l:expanded = expand(a:arg)
        if type(l:expanded) == v:t_list
            for item in l:expanded
                call s:AddFileToList(item, a:result)
            endfor
            return
        endif
    else
        " 通常のファイルパスやglobパターンの処理
        call s:AddFileToList(a:arg, a:result)
    endif
endfunction

" ファイルをリストに追加する関数
function! s:AddFileToList(arg, result)
    let l:expanded = expand(a:arg)
    if s:IsReadableFile(l:expanded)
        call add(a:result.files, l:expanded)
    elseif s:IsGlobPattern(a:arg)
        call add(a:result.files, a:arg)
    else
        " ファイルパスでない場合はプロンプトとして追加
        call add(a:result.prompts, a:arg)
    endif
endfunction

" ファイルが読み取り可能かチェックする関数
function! s:IsReadableFile(path)
    return filereadable(a:path)
endfunction

" globパターンかどうかをチェックする関数
function! s:IsGlobPattern(arg)
    return a:arg =~# '\*'
endfunction

" ファイルリストを構築する関数
function! s:BuildFileList(files)
    let l:file_list = []
    for file in a:files
        call extend(l:file_list, ["-f", file])
    endfor
    return l:file_list
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
