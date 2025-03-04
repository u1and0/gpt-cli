" LLM AIによる補完

" gptcli#GPT(system_prompt, {kwargs}) でGPTを実行
" kwargs: model, max_tokens, temperature, url, file
function! gptcli#GPT(system_prompt, kwargs={}) range
    let l:args = ["gpt", "-n"]
    if a:system_prompt != ""
        let l:system_prompt = "'" . a:system_prompt . " Use syntax of " . &ft .  ".'"
        call add(l:args, "-s")
        call add(l:args, l:system_prompt)
    endif

    " kwargsをコマンド引数に追加
    for [key, val] in items(a:kwargs)
        if key == "model" | call add(l:args, "-m")
        elseif key == "max_tokens" | call add(l:args, "-x")
        elseif key == "temperature" | call add(l:args, "-t")
        elseif key == "url" | call add(l:args, "-u")
        elseif key == "file" | call add(l:args, "-f")
        endif
        if key != "file"
            call add(l:args, val)
        endif
    endfor

    " 選択範囲をユーザープロンプトとして追加
    let l:user_prompt = "'" . join(getline(a:firstline, a:lastline), "\n") . "'"
    call add(l:args, l:user_prompt)

    " GPT実行と結果の挿入
    let l:cmd = join(l:args)
    let l:result = systemlist(l:cmd)
    call append(a:lastline, l:result)
endfunction

" GPTChatコマンド: GPTWindow()を呼び出す
" command! -nargs=* GPTChat call gptcli#GPTWindow(<f-args>, {'model': s:model})
" GPTWindow(args..., kwargs)で詳細設定可能
function! gptcli#GPTWindow(...)
    let l:all_args = copy(a:000)

    " 最後の引数が辞書型ならkwargsとして取得
    let l:kwargs = {}
    if len(l:all_args) > 0 && type(l:all_args[-1]) == v:t_dict
        let l:kwargs = remove(l:all_args, -1)
    endif

    " 残りの引数をargsとして処理
    " <f-args>で空のリストが渡された場合の対応
    let l:args = []

    " 残りの引数がある場合
    if !empty(l:all_args)
        " 引数がひとつだけで、かつそれがリストの場合（:call gptcli#GPTWindow(['関西弁で話して'], {..}）のケース
        if len(l:all_args) == 1 && type(l:all_args[0]) == v:t_list
            let l:args = l:all_args[0]
        else
            " 通常の引数リスト（:GPTChat 引数1 引数2...のケース）
            let l:args = l:all_args
        endif
    endif

    " gptコマンドの構築
    let l:gpt_command = ["gpt"]

    " ファイルとプロンプトの処理
    let [l:file_list, l:system_prompt] = s:ProcessArgs(l:args)

    " システムプロンプトがあれば追加
    if l:system_prompt != ""
        call extend(l:gpt_command, ["-s", '"' . l:system_prompt . '"'])
    endif

    " ファイルリストがあれば追加
    if !empty(l:file_list)
        call extend(l:gpt_command, l:file_list)
    endif

    " kwargsをコマンド引数に追加
    for [key, val] in items(l:kwargs)
        if key == "model" | call add(l:gpt_command, "-m")
        elseif key == "max_tokens" | call add(l:gpt_command, "-x")
        elseif key == "temperature" | call add(l:gpt_command, "-t")
        elseif key == "url" | call add(l:gpt_command, "-u")
        endif
        call add(l:gpt_command, val)
    endfor

    echo join(l:gpt_command)

    " 新規ウィンドウでGPT実行
    let l:cmd = ["new", "|", "term"]
    call extend(l:cmd, l:gpt_command)
    execute join(l:cmd)
endfunction

" 引数を処理する新しいヘルパー関数
function! s:ProcessArgs(args)
    " 引数が空でもエラーにならないよう対応
    if empty(a:args)
        return [[], ""]
    endif

    " 引数をファイルパスとプロンプトに分類
    let l:classification = s:ClassifyArguments(a:args)
    let l:file_list = s:BuildFileList(l:classification.files)
    let l:system_prompt = join(l:classification.prompts, ' ')

    return [l:file_list, l:system_prompt]
endfunction

" 引数を分類
function! s:ClassifyArguments(args)
    let l:result = {'files': [], 'prompts': []}

    " argsが有効なリストでない場合は空のresultを返す
    if type(a:args) != v:t_list
        return l:result
    endif

    " 通常の処理
    for arg in a:args
        " argが有効値かチェック（nil や無効な型でないか）
        if type(arg) == v:t_string
            call s:ClassifySingleArgument(arg, l:result)
        endif
    endfor

    return l:result
endfunction

" 単一引数を分類
function! s:ClassifySingleArgument(arg, result)
    let l:expanded = expand(a:arg)
    if s:IsReadableFile(l:expanded) || s:IsGlobPattern(a:arg)
        call add(a:result.files, l:expanded)
    else
        call add(a:result.prompts, a:arg)
    endif
endfunction

" ファイルをリストに追加
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

" 読み取り可能なファイルかチェック
function! s:IsReadableFile(path)
    return filereadable(a:path)
endfunction

" Globパターンかチェック
function! s:IsGlobPattern(arg)
    return a:arg =~# '\*'
endfunction

" ファイルリストを構築
function! s:BuildFileList(files)
    let l:file_list = []
    for file in a:files
        call extend(l:file_list, ["-f", file])
    endfor
    return l:file_list
endfunction
