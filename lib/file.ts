/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

import { expandGlob } from "https://deno.land/std/fs/mod.ts";

export interface CodeBlock {
  content: string;
  filePath: string;
  toString(): string;
}

export const newCodeBlock = (
  content: string,
  filePath: string = "",
): CodeBlock => {
  return {
    content,
    filePath,
    toString: () => {
      return [
        "```" + filePath, // 1行目はコードブロックとファイルパス
        content, // ファイルの内容
        "```", // 最終行はコードブロック
      ].join("\n");
    },
  };
};
/** ファイルパスを引数に、
 * ファイルの内容をコードブロックに入れて返す
 */
export async function parseFileContent(
  filePath: string,
): Promise<CodeBlock> {
  try {
    const content = await Deno.readTextFile(filePath);
    return newCodeBlock(content, filePath);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    // エラーを re-throw することで、呼び出し元にエラーを伝播する
    throw error;
  }
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
      continue; // glob パターンでない場合は、expandGlob をスキップする
    }
    try {
      const globIterator = expandGlob(pattern); // 明示的に型指定
      for await (const filePath of globIterator) {
        yield filePath.path; // filePathはGlobEntry型なので、.pathでstringを取り出す
      }
    } catch (error) {
      console.error(`Error expanding glob pattern ${pattern}:`, error);
      // エラー処理 (例: ユーザーに警告を表示)
      continue; // 次のパターンに進む
    }
  }
}
