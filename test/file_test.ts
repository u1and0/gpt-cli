// deno test --allow-read --allow-write
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";
import { exists } from "jsr:@std/fs/exists";
import { expect } from "jsr:@std/expect";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std/testing/bdd.ts";

import { HumanMessage } from "npm:@langchain/core/messages";

import {
  filesGenerator,
  InitialPrompt,
  newCodeBlock,
  parseFileContent,
} from "../lib/file.ts";

describe("create test directory", () => {
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

describe("InitialPrompt", () => {
  // Test constructor and initial content
  describe("constructor", () => {
    it("should create an InitialPrompt with the given content", () => {
      const content = "Initial content";
      const message = new InitialPrompt(content);
      expect(message.getContent()).toBe(content);
    });

    it("should handle empty string content", () => {
      const message = new InitialPrompt("");
      expect(message.getContent()).toBe("");
    });
  });

  describe("addContent() method", () => {
    it("既存のコンテンツにコードブロックを追加する", () => {
      const codeBlock = newCodeBlock("function test() {}", "test.txt");
      const message = new InitialPrompt("Initial message");

      const updatedPrompt = message.addContent(codeBlock);

      expect(updatedPrompt.getContent()).toBe(`Initial message
\`\`\`test.txt
function test() {}
\`\`\``);
    });

    it("should create a new InitialPrompt instance without modifying the original", () => {
      const initialContent = "Initial message";
      const codeBlock = newCodeBlock("function test() {}");
      const message = new InitialPrompt(initialContent);

      const updatedPrompt = message.addContent(codeBlock);

      expect(message.getContent()).toBe(initialContent);
      expect(updatedPrompt.getContent()).not.toBe(message.getContent());
    });

    it("should handle adding multiple code blocks", () => {
      const initialContent = "Initial message";
      const codeBlock1 = newCodeBlock("function test1() {}");
      const codeBlock2 = newCodeBlock("function test2() {}");

      const message = new InitialPrompt(initialContent)
        .addContent(codeBlock1)
        .addContent(codeBlock2);

      expect(message.getContent()).toBe(`${initialContent}
${codeBlock1}
${codeBlock2}`);
    });

    it("空の初期メッセージにコードブロックを追加する処理を行う必要がある。", () => {
      const codeBlock = newCodeBlock("function test() {}");
      const message = new InitialPrompt("").addContent(codeBlock);

      expect(message.getContent()).toBe(`
\`\`\`
function test() {}
\`\`\``);
    });
  });

  // Test getContent method
  describe("getContent method", () => {
    it("should return the exact content of the message", () => {
      const content = "Test content with special characters: !@#$%^&*()";
      const message = new InitialPrompt(content);

      expect(message.getContent()).toBe(content);
    });
  });
});

// Just test the file attachment functionality directly
Deno.test("File Command - parseFileContent", async () => {
  // Create a temporary file for testing
  const tempFileName = await Deno.makeTempFile({ suffix: ".txt" });
  try {
    // Write test content to the file
    const testContent = "This is a test file content.";
    await Deno.writeTextFile(tempFileName, testContent);

    // Test parsing the file content
    const codeBlock = await parseFileContent(tempFileName);

    // Verify the content was read correctly
    assertEquals(codeBlock.content, testContent);

    // Verify the file path was stored
    assertEquals(codeBlock.filePath, tempFileName);

    // Verify toString formats correctly with markdown code block
    const formatted = codeBlock.toString();
    assert(formatted.startsWith("```" + tempFileName));
    assert(formatted.includes(testContent));
    assert(formatted.endsWith("```"));

    // Test creating a human message with the file content
    const fileMessage = new HumanMessage(
      `Here's the file I'm attaching:\n${codeBlock.toString()}`,
    );
    // Convert content to string for comparison
    const messageContent = String(fileMessage.content);
    assert(messageContent.includes(testContent));
    assert(messageContent.includes("```"));
  } finally {
    // Clean up the temporary file
    await Deno.remove(tempFileName);
  }
});
