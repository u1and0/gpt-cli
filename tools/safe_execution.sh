#!/bin/bash
# プロンプトの実行前にyes/no (y/N) を聞いてくる。
# Yesの場合に実行する。
# Noの場合はabortメッセージを出してエラーコード1で終了する。
#
# usage:
# $ echo "ls -l" | ./safe_execution.sh | bash

code=$(cat)
# Display the generated code
echo -e "Generated code:\n\n $code\n" >&2
# Check the user's response and act accordingly
read -n1 -p "Execute? (y/N): " yn < /dev/tty
[[ $yn =~ [yY] ]] &&
    { echo -e "\n$code" >&2; echo "$code"; } ||
    { echo "Aborted." >&2; exit 1; }
