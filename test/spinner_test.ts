import { Spinner } from "../lib/spinner.ts";
import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";

Deno.test("Start and stop the spinner", () => {
  const spinner = new Spinner([".", "..", "..."], 100, 1000);
  spinner.start();
  spinner.stop();
});

// Deno.test("Spinner timeout", async () => {
//   const timeoutSpinner = new Spinner([".", "..", "..."], 100, 500);
//   const longTimeProcess = async (): Promise<void> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         console.log("long time processing...");
//         resolve();
//       }, 1000);
//     });
//   };
//   const sleep = (ms: number): Promise<void> => {
//     return new Promise((resolve) => setTimeout(resolve, ms));
//   };
//   assertThrows(
//     async () => {
//       timeoutSpinner.start();
//       // await longTimeProcess();
//       // sleep(1000);
//       await new Promise((resolve) => setTimeout(resolve, 1000));
//       timeoutSpinner.stop();
//     },
//     Error,
//     "Timeout error",
//   );
// });

Deno.test("Spinner with empty texts array", () => {
  assertThrows(
    () => new Spinner([], 100, 1000),
    Error,
    "Texts array must not be empty",
  );
});

Deno.test("Spinner with negative interval", () => {
  assertThrows(
    () => new Spinner([".", "..", "..."], -100, 1000),
    Error,
    "Interval must be a positive number",
  );
});

Deno.test("Spinner with negative timeout", () => {
  assertThrows(
    () => new Spinner([".", "..", "..."], 100, -1000),
    Error,
    "Timeup must be a positive number",
  );
});
