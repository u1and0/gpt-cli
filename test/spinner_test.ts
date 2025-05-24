import { Spinner } from "../lib/spinner.ts";
import { assertThrows } from "https://deno.land/std@0.224.0/assert/assert_throws.ts";

Deno.test("Start and stop the spinner", () => {
  const spinner = new Spinner([".", "..", "..."], 100, 1000);
  spinner.start();
  spinner.stop();
});

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
    "Timeout must be a positive number",
  );
});
