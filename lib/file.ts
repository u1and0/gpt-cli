/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

import { expandGlob, GlobIterator } from "https://deno.land/std/fs/mod.ts";

export type CodeBlock = string;

/** ファイルパスを引数に、
 * ファイルの内容をコードブロックに入れて返す
 */
export async function parseFileContent(
  filePath: string,
): Promise<CodeBlock> {
  try {
    const content = await Deno.readTextFile(filePath);
    const codeBlock: CodeBlock = [
      "```" + filePath, // 1行目はコードブロックとファイルパス
      content, // ファイルの内容
      "```", // 最終行はコードブロック
    ].join("\n");
    return codeBlock;
  } catch (error) {
    // Skip the file and continue
    console.error(`Error reading file ${filePath}:`, error);
  }
  return "";
}

// Helper function to check if a string is a glob pattern
function isGlobPattern(pattern: string) {
  // Simple check for common glob wildcards
  return /\*|\?|\[|\]/.test(pattern);
}

/** 与えられたパターンに応じてパスを返すジェネレーター
 * globパターンが含まれている場合:
 *  expandGlob()を使ってファイル名をyieldする
 * globパターンが含まれていない場合:
 *  patternをそのままyieldする
 */
export async function* filesGenerator(
  patterns: string[],
): AsyncGenerator<string> {
  for (const pattern of patterns) {
    if (!isGlobPattern(pattern)) {
      yield pattern;
    }
    const globIterator: GlobIterator = expandGlob(pattern); // 明示的に型指定
    for await (const filePath of globIterator) {
      yield filePath.path; // filePathはGlobEntry型なので、.pathでstringを取り出す
    }
  }
}
