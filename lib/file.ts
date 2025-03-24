/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

import { expandGlob } from "https://deno.land/std/fs/mod.ts";

/**
 * コードブロックを表すインターフェース。
 */
export interface CodeBlock {
  content: string;
  filePath: string;
  toString: () => string;
}

/**
 * ファイルの内容とファイルパスを引数にして、コードブロック型を返す関数
 * @param {string} content ファイルの内容
 * @param {string} filePath ファイルパス
 * @returns {CodeBlock} toString()メソッドがコードブロック形式のCodeBlock型
 */
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

/**
 * ファイルパスを引数に、ファイルの内容をコードブロックに入れて返す。
 * @param filePath ファイルパス
 * @returns ファイル内容を含むCodeBlock
 * @throws ファイル読み込みエラーが発生した場合
 */
export async function parseFileContent(
  filePath: string,
): Promise<CodeBlock> {
  try {
    const content = await Deno.readTextFile(filePath);
    const codeBlock: CodeBlock = {
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
    return codeBlock;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Helper function to check if a string is a glob pattern
 * @param pattern チェックするパターン
 * @returns グロブパターンか否か
 */
function isGlobPattern(pattern: string): boolean {
  return /\*|\?|\[|\]/.test(pattern);
}

/**
 * 与えられたパターンに応じてパスを返すジェネレーター。
 * globパターンが含まれている場合はexpandGlob()を使用し、含まれていない場合はパター
ンをそのままyieldする。
 * @param patterns ファイルパスまたはグロブパターンの配列
 * @yields ファイルパス
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
      const globIterator = expandGlob(pattern);
      for await (const filePath of globIterator) {
        yield filePath.path;
      }
    } catch (error) {
      console.error(`Error expanding glob pattern ${pattern}:`, error);
      continue; // 次のパターンに進む
    }
  }
}

/**
 * コマンドラインパラメータからの初期プロンプトを管理するクラス。
 */
export class InitialPrompt {
  constructor(private readonly content: string) {}

  /**
   * コードブロックを改行区切りでプロンプトに追加する。
   * @param codeBlock 追加するコードブロック
   * @returns 新しいInitialPromptインスタンス
   */
  public addContent(codeBlock: CodeBlock): InitialPrompt {
    return new InitialPrompt(
      `${this.content}
${codeBlock}`,
    );
  }

  /**
   * 現在のプロンプトの内容を返す。
   * @returns プロンプトの内容
   */
  public getContent(): string {
    return this.content;
  }
}
