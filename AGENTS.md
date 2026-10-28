# Project Rules
## Prompt Logging
Every time you receive a new instruction or prompt, append it to prompts.txt in the project root with a timestamp (ISO 8601) and a brief summary of what you did in response. Create the file if it doesn't exist. Keep this log updated throughout all sessions.

## Design
Use the Linear-inspired direction in `DESIGN-RESEARCH.md`. Reuse controls in `src/components/ui/` and semantic colors in `src/app/globals.css`. Do not introduce raw form controls, inline styles, arbitrary Tailwind values, or named Tailwind colors in feature components. Add missing shared controls and tokens when needed. Use `CloseButton` for modal close actions. Use Lucide icons as described in `DESIGN-RESEARCH.md`. Check visual changes in a browser.
