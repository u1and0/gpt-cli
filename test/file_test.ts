// deno test --allow-read --allow-write
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { exists } from "jsr:@std/fs/exists";
import { expect } from "jsr:@std/expect";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std/testing/bdd.ts";

import { filesGenerator, parseFileContent } from "../lib/file.ts";

describe("create test directory", async () => {
  const tempDir = new URL("./temp/", import.meta.url);
  beforeAll(async () => {
    // 絶対パスで一時ディレクトリを作成
    if (!await exists(tempDir)) {
      await Deno.mkdir(tempDir, { recursive: true });
    }
    const testFiles = ["file.txt", "dir", "test.js", "test.ts"];

    // 一時ファイルを作成
    for (const file of testFiles) {
      const filePath = new URL(file, tempDir);
      await Deno.writeTextFile(filePath, "");
    }
  });

  afterAll(() => {
    Deno.removeSync(tempDir, { recursive: true });
  });

  it("Read file contents test", async () => {
    const filePath = "./file1.txt";
    const expectedContent = "This is the content of file1.";

    try {
      await Deno.writeTextFile(filePath, expectedContent);
      const fileContent = await parseFileContent(filePath);

      assertEquals(
        fileContent.toString(),
        "```" + filePath + "\n" + expectedContent + "\n```",
      );
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    } finally { // Clean up test files
      try {
        await Deno.remove(filePath);
      } catch (cleanupError) {
        console.error("Error cleaning up test files:", cleanupError);
      }
    }
  });

  it("非Globパターンはそのまま生成される", async () => {
    const patterns = ["test.js", "dir"];
    const generator = filesGenerator(patterns);
    const result: string[] = [];

    for await (const file of generator) {
      result.push(file);
    }

    assertEquals(result, ["test.js", "dir"]);
  });

  it("Globパターンが正しく展開される", async () => {
    const patterns = ["./test/**/*.txt", "./test/**/*.js"];
    const generator = filesGenerator(patterns);
    const result: string[] = [];

    for await (const file of generator) {
      result.push(file);
    }

    expect(result).toContain(Deno.cwd() + "/test/temp/file.txt");
    expect(result).toContain(Deno.cwd() + "/test/temp/test.js");
  });
});
