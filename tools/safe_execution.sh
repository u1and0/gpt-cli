#!/bin/bash
# プロンプトの実行前にyes/no (y/N) を聞いてくる。
# Yesの場合に実行する。
# Noの場合はabortメッセージを出してエラーコード1で終了する。
#
# usage:
# $ echo "ls -l" | ./safe_execution.sh | bash

# Check if input is from a pipe or arguments
if [ -t 0 ]; then
  # Input from arguments
  code="$*"
else
  # Input from pipe
  code=$(cat)
fi

# Display the generated code
# echo -e "\nGenerated code:"
echo -e "Generated code:\n\n $code\n" >&2

# Prompt for confirmation
# read コマンドの入力を直接ターミナルから取得するために、
# /dev/tty を使用します。
read -n1 -p "Execute this code? (y/N): " yn < /dev/tty

# Check the user's response and act accordingly
if [[ $yn =~ [yY]  ]]; then
    echo -e "\n$code" >&2
    echo "$code"
else
    echo "Code execution aborted." >&2
    exit 1
fi
