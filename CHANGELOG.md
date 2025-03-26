# v0.9.5 Release Notes

## **New Features:**

*   **[feat] New LLM Google Gemma:** Added support for the new Google Gemma LLM.
*   **[feat] Code execution:** Implemented code execution functionality with the following features:
    *   **[feat] Extract code block by grep | sed, and safe execution by safe\_execution:** Extracts code blocks using `grep` and `sed`.
    *   **[feat] tools/safe\_execution.sh:** Implemented `safe_execution.sh` to handle the execution of code blocks.  The script prompts the user for permission before execution, ensuring safer code execution.

## **Refactor:**

*   **[refactor] Shortened code assuming piped input:**  The code has been refactored and shortened with the assumption that input will be provided via a pipe.

## **Documentation:**

*   **[doc] version info, new model 0day @README:** Updated version information and added details about the new model to the README.
*   **[docs] fix:** Fixed documentation issues.
*   **[docs] count s experiment:** Experimented with counting "s" in the documentation.
*   **[docs] Add result to system prompt** Added information on how to include results in the system prompt and removed specific model names.
*   **[docs] Code execution:** Added documentation related to the code execution feature.
