# v0.9.6 Release Notes
This update brings significant improvements to the project's integration with Hugging Face, along with several quality-of-life enhancements and bug fixes. Users are encouraged to review the detailed commit history for more insights into specific changes and updates.

## Changes
- **[chore]**: Added `ts-ignore` for type checks to ensure smoother CI/CD processes.
- **[chore]**: Updated GitHub Actions to include `tsconfig.json` and `deno.json` for better configuration management.
- **[chore]**: Ignored tsconfig option for deno check on GitHub Actions to resolve potential conflicts.
- **[style]**: Removed unused comment-out code for better code cleanliness.
- **[doc]**: Updated version information for transparency and tracking.
- **[style]**: Modified permissions for `tools/*.sh` scripts to mode 755 for better execution and security.

## Features and Fixes
- **[refactor]**: Refactored `BaseMessage` import to utilize langchain messages, enhancing modularity.
- **[feat]**: Introduced `toRoleContent(BaseMessage) => MessageFieldWithRole` for improved message handling.
- **[feat]**: Integrated Hugging Face stream generator, expanding functionality.
- **[test]**: Refactored and enhanced tests for `formatHuggingFacePrompt()` to ensure reliability.
- **[fix]**: Addressed issues with Hugging Face stream functionality to improve performance and stability.

## Hotfixes
- **[fix]**: Resolved the issue of "zip in zip" to prevent file corruption or errors during packaging.
- **[chore]**: Implemented measures to remove release-package directories to clean up the environment.
