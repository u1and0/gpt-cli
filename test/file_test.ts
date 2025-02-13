// deno test --allow-read --allow-write
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { parseFileContents } from "../lib/file.ts";

Deno.test("Read file contents test", async () => {
  const filePaths = ["./file1.txt", "./file2.txt"];
  const expectedContents = [
    "This is the content of file1.",
    "This is the content of file2.",
  ];

  try {
    // Create test files
    await Deno.writeTextFile(filePaths[0], expectedContents[0]);
    await Deno.writeTextFile(filePaths[1], expectedContents[1]);

    // Read file contents
    const fileContents = await parseFileContents(filePaths);

    // Assert results
    assertEquals(fileContents.length, expectedContents.length);
    for (let i = 0; i < fileContents.length; i++) {
      assertEquals(
        fileContents[i],
        "```" + filePaths[i] + "\n" + expectedContents[i] + "\n```",
      );
    }
  } catch (error) {
    console.error("Error during test:", error);
    throw error;
  } finally { // Clean up test files
    try {
      await Deno.remove(filePaths[0]);
      await Deno.remove(filePaths[1]);
    } catch (cleanupError) {
      console.error("Error cleaning up test files:", cleanupError);
    }
  }
});
