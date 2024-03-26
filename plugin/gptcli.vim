" LLM AI Supported C-X Completion

" :GPT*コマンドとして使用
" Create code continuously or Generate code to docs
command! -nargs=0 -range GPTGenerateCode <line1>,<line2>call gptcli#GPT('You are best of code generator. Generate a prompt to continue coding based on the given input code. Generate only code effectively, DO NOT generate descriptions nor code blocks. If you need describe code, please comment out it.', {max_tokens: 400, temperature: 0.8})
" Keybind C-X, C-G
inoremap <C-x><C-g> <Esc>:GPTGenerateCode<CR>
" Docs to code
command! -nargs=0 -range GPTGenerateDocs <line1>,<line2>call gptcli#GPT('あなたは最高のコードライターです。 与えられたコードに基づいてわかりやすい日本語のドキュメントをコメントアウトして生成してください。', {max_tokens: 2000})
" Create test code
command! -nargs=0 -range GPTGenerateTest <line1>,<line2>call gptcli#GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', {max_tokens: 1000, temperature: 0.5})
" command! -nargs=0 -range GPTErrorBustor <line1>,<line2>call gptcli#GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', 1000, 0.5)
" command! -nargs=0 -range GPTCodeOptimizer <line1>,<line2>call gptcli#GPT('You are the best code tester. Please write test code that covers all cases to try the given code.', 1000, 0.5)

" Any system prompt
command! -nargs=? -range GPTComplete <line1>,<line2>call gptcli#GPT(<q-args>)
" Conversate with GPT
command! -nargs=? GPTConversate call gptcli#GPTWindow(<q-args>)
