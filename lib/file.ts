/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

type CodeBlock = string;

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
