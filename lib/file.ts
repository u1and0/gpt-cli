/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

import { expandGlob } from "https://deno.land/std@0.208.0/fs/expand_glob.ts";

/**
 * コードブロックを表すインターフェース。
 */
export interface CodeBlock {
  content: string;
  filePath: string;
  toString: () => string;
}

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
      continue; // グロブパターンでない場合は、expandGlob をスキップ
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
  private add(codeBlock: CodeBlock): InitialPrompt {
    return new InitialPrompt(this.content + "\n" + codeBlock);
  }

  /**
   * ファイルの内容を解釈してコードブロックを追加する。
   * @param filePath ファイルパス
   * @returns 新しいInitialPromptインスタンス
   */
  public async addContent(filePath: string): Promise<InitialPrompt> {
    try {
      const codeBlock = await parseFileContent(filePath);
      return this.add(codeBlock);
    } catch (error) {
      console.error("Error: parse file content:", error);
      return this; // エラー時は現在のインスタンスを返す
    }
  }

  /**
   * 複数のファイルを一括で追加するメソッド
   * @param patterns ファイルパスまたはグロブパターンの配列
   * @returns 新しいInitialPromptインスタンス
   */
  public async addContents(...patterns: string[]): Promise<InitialPrompt> {
    let currentPrompt = this; // 初期値は this

    for await (const filePath of filesGenerator(patterns)) {
      try {
        // addContent を呼び出す際に this を使用
        currentPrompt = await currentPrompt.addContent(filePath);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        // エラー処理を適切に行う
      }
    }

    return currentPrompt;
  }

  /**
   * 現在のプロンプトの内容を返す。
   * @returns プロンプトの内容
   */
  public getContent(): string {
    return this.content;
  }
}
