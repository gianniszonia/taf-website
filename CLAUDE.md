# CLAUDE.md

The shared guide for all agents is AGENTS.md (imported below) — keep project knowledge there, not here,
so Codex and Claude read the same thing. Details: content/README.md, docs/design.md, docs/history.md.

@AGENTS.md

## Claude Code specifics

- Preview: `.claude/launch.json` → server `taf-demo` (port 5173). Use the browser-pane preview tools, not Bash, to run it.
- The preview pane is frequently **hidden**: lazy images and IntersectionObserver are throttled and screenshots lag
  one frame. Before screenshotting, force-load images and add `.in` to `.rv, .wipe, .card`; prefer JS measurements
  (`getBoundingClientRect`, HEAD requests for images) over pixels. Emulate 1920×1031, 1366×768 and 375×812, then reset
  the viewport to "desktop".
- Shell is Windows (Git Bash + PowerShell). No Python. Write temporary helper scripts inside the project (so `sharp`
  resolves from `node_modules`) and delete them afterwards; scratch output goes to the session scratchpad.
- `npm run build` re-renders every image (~1–2 min); run it in the background if needed.
- When updating docs after a change: status lives in AGENTS.md; the editor workflow in content/README.md;
  append notable attempts/failures to docs/history.md.
