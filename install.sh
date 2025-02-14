#!/bin/bash

# OSとアーキテクチャを取得
get_os_arch() {
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch=$(uname -m)
    # OSの名前を標準化
    case "$os" in
        linux) os="linux" ;;
        darwin) os="macos" ;;
        msys*|mingw*) os="windows" ;;
    esac
    # アーキテクチャを標準化
    case "$arch" in
        x86_64) arch="x64" ;;
        aarch64|arm64) arch="arm64" ;;
        armv7*) arch="arm" ;;
    esac
    echo "${os}-${arch}"
}

os_arch=$(get_os_arch)
echo Your OS and Archtechture: $os_arch

# 最新のバージョンのzipをダウンロードするURLを取得
latest_url=$(curl -s https://api.github.com/repos/u1and0/gpt-cli/releases/latest \
    | grep "browser_download_url.*gpt-cli-${os_arch}.zip" \
    | cut -d '"' -f 4)
echo Download gpt-cli zip file from $latest_url...
# Validate and set variables
if [ -z "$latest_url" ] || [ -z "$os_arch" ]; then
    echo "Error: Required variables not set."
    exit 1
fi

# Consolidated installation steps with error checking
install_gpt() {
    # Download with progress and error handling
    curl -L -o "gpt-cli-${os_arch}.zip" "$latest_url" || {
        echo "Download failed."
        return 1
    }

    # Unzip with error checking
    unzip -q "gpt-cli-${os_arch}.zip" || {
        echo "Extraction failed."
        return 1
    }

    # Remove zip file if successful
    rm "gpt-cli-${os_arch}.zip"
}

# Execute installation and handle status
if install_gpt; then
    echo "GPT command installation completed successfully."
else
    echo "GPT command installation failed."
    exit 1
fi

# link path
check_binary() {
  echo -n "  - gpt実行可能ファイルを確認しています ... "
  local output
  output=$(GPT_DEFAULT_OPTS= "$gpt_base"/bin/gpt --version 2>&1)
  if [ $? -ne 0 ]; then
    echo "エラー: $output"
    binary_error="無効なバイナリ"
  fi
  rm -f "$gpt_base"/bin/gpt
  return 1
}

link_gpt_in_path() {
  if which_gpt="$(command -v gpt)"; then
    echo "  - \$PATH内で見つかりました"
    echo "  - シンボリックリンクの作成: bin/gpt -> $which_gpt"
    (cd "$gpt_base"/bin && rm -f gpt && ln -sf "$which_gpt" gpt)
    check_binary && return
  fi
  return 1
}

# Set gpt base path
cd "$(dirname "${BASH_SOURCE[0]}")"
gpt_base=$(pwd)
gpt_base_esc=$(printf %q "$gpt_base")

# gpt-cliのインストール
if install_gpt; then
  echo "GPTコマンドのインストールが正常に完了しました。"
else
  echo "GPTコマンドのインストールに失敗しました。"
  exit 1
fi

# gptに関連した処理
link_gpt_in_path

# エラーチェック
if [ -n "$binary_error" ]; then
  echo "gpt関連のエラー: $binary_error"
  exit 1
fi
