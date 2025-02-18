// deno test --allow-read --allow-write
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { parseFileContent } from "../lib/file.ts";

Deno.test("Read file contents test", async () => {
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
