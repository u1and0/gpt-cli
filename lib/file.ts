/* ファイルの内容を読み込んでプロンプトに渡すモジュール
* -f, --fileオプションで指定したファイルパスのファイルを適切に処理して
*  ユーザープロンプトとする
* */

export async function parseFileContents(
  filePaths: string[],
): Promise<string[]> {
  const contentsArray: string[] = [];

  for (const filePath of filePaths) {
    try {
      const content = await Deno.readTextFile(filePath);
      contentsArray.push(content);
    } catch (error) {
      // Skip the file and continue
      console.error(`Error reading file ${filePath}:`, error);
    }
  }
  return contentsArray;
}
