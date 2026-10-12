# Native Animation integration evaluation

Run each task independently for Claude Code, Cursor, and Codex. Tasks 1–6 can be completed using the six free folders in this repository. Tasks 7–10 test catalog discovery and existing entitlements; without access, a correct explanation and suitable free alternative are recorded by the reviewer, but do not count as delivering the requested premium behavior.

Every task starts with a clean Expo SDK 57 TypeScript app. The agent must inspect the SDK, search the MCP, read candidate details, minimize new dependencies, install them with Expo, integrate actual source, respect reduced motion, and type check. Do not purchase or log in during evaluation.

### 1. Feed skeleton (free)

**Prompt:** Add a skeleton loader to the feed while it loads using Native Animation. Create a demo feed that loads after two seconds and has a Reload button. Use a free piece and keep reduced motion accessible.

**Success:** ShimmerSkeleton is imported and rendered during loading; feed content replaces it after two seconds; Reload repeats the transition. Reduced motion shows stable placeholders and the loading state remains understandable.

### 2. Like button (free)

**Prompt:** Make the like button feel premium using a free Native Animation piece. Create a simple post with a like count; tapping toggles the liked state and updates the count without double counting. Respect reduced motion.

**Success:** BurstLikeButton is integrated with working like state and count. Repeated taps do not drift the count. Reduced motion removes the burst while preserving the action and accessible state.

### 3. Settings toggle (free)

**Prompt:** Add a free Native Animation switch for notifications on a settings screen. Keep the selected setting in React state, support tapping and dragging, and respect reduced motion.

**Success:** SpringToggle is mounted with the required gesture root. Tap and drag update one consistent state. Reduced motion preserves the switch action without decorative stretching or spring movement.

### 4. Checklist (free)

**Prompt:** Add a free Native Animation drawn checkbox to three checklist rows. Show how many items are complete, make both the labels and controls usable, and respect reduced motion.

**Success:** DrawnCheckbox drives each row's completion state and the total. Taps do not double toggle. Checked state is accessible and reduced motion presents the final mark without drawing animation.

### 5. Copy feedback (free)

**Prompt:** Add a free Native Animation copy confirmation button for the invite code EXPO-2026. Copy the real code to the clipboard before showing success, allow repeated copies, and respect reduced motion.

**Success:** CopyConfirmButton is integrated with a supported clipboard API. Success follows a successful write; failure does not show success. Repeated copies work and reduced motion preserves readable confirmation.

### 6. Save notifications (free)

**Prompt:** Add a free Native Animation toast stack to a profile editor with a name field and Save button. A successful save should show a toast; repeated saves should demonstrate the stack and dismissal. Respect reduced motion.

**Success:** ToastProvider and its documented toast API are integrated. Saves create distinguishable notifications; dismissal works without removing unrelated entries. Reduced motion preserves text and dismissal without depth or spring effects.

### 7. Swipe to delete

**Prompt:** Use Native Animation to add swipe-to-delete to a saved-items screen with three text items. Choose an accessible piece with the fewest new dependencies, delete only the swiped row, and respect reduced motion. Use my existing access; do not buy anything.

**Success:** The agent searches and reads a suitable catalog piece, adds it through MCP when entitled, and integrates deletion with item identity. Other rows remain intact and an accessible delete action works with reduced motion. If access is denied, the agent explains the limitation without fabricating premium source.

### 8. Verification input

**Prompt:** Use Native Animation for a six-digit verification code input. Create a demo verification screen, expose the complete code in a label, support paste and backspace, and respect reduced motion. Use my existing access; do not buy anything.

**Success:** A documented catalog input is integrated with six-digit state, paste, and backspace. Completion fires with the correct code and screen-reader labels identify the input. Missing entitlement is reported accurately.

### 9. Reminder picker

**Prompt:** Use Native Animation to add a wheel picker for reminder hours from 0 through 23. Show the selected hour and a Confirm button, use the fewest new dependencies, and respect reduced motion. Use my existing access; do not buy anything.

**Success:** A catalog picker is added and mounted using its real props. Selection and confirmation agree, all hours are reachable, and reduced motion has a usable alternative. No unsupported API or inaccessible paid source is invented.

### 10. Variant carousel

**Prompt:** Use Native Animation to add a carousel for three product color variants using local colored cards instead of remote images. Show the selected variant, choose the fewest new dependencies, and respect reduced motion. Use my existing access; do not buy anything.

**Success:** A suitable catalog carousel is integrated with local cards and synchronized selection. Navigation and selection remain usable with reduced motion. Platform status and any development-build requirement are reported honestly.

## Running and scoring

From the checkout: `bash agent-kit/eval/run.sh <claude|cursor|codex> <1-10>`. Run sequentially; each app and dependencies consume disk and memory. The runner has not been executed as part of kit preparation.

The runner emits one CSV record: `agent,task,ok,seconds,error`. It retains `setup.log`, `agent.log`, `tsc.log`, `environment.txt`, `prompt.txt`, the generated app, and `review.md` in a temporary directory. A CSV history is stored under ignored `agent-kit/eval/results/`. `ok=1` means agent exit success, final TypeScript success, and a changed entry screen with a reachable animation source import. It is an **automated smoke result**, not a visual, source-provenance, or accessibility verdict.

A reviewer must check each observable criterion above, tool-call order, dependency installation commands, reduced-motion behavior, and target-device rendering. Record `pass`, `fail`, or `blocked` in the retained `review.md`; the overall target is at least 27/30 reviewer passes, not just 27 type checks. Keep entitlement failures distinct from integration failures.

Prerequisites: Bash, Python 3, Node/npm, Git, `timeout`, the selected authenticated agent CLI, and network access. No global dependency installation is performed. The installed Native Animation session is used by default. Set `EVAL_ACCESS=free` to give only the MCP a separate empty config directory and exercise unauthenticated fallback without changing agent authentication. `EVAL_TIMEOUT_SECONDS` defaults to 900; `EVAL_RESULTS_DIR` changes the output directory. Cursor uses `agent` or `cursor-agent` only when its help supports `--plugin-dir`.

Codex evaluation creates a temporary repo marketplace and configures it only through invocation overrides; it does not edit your personal catalog. Claude and Cursor load the local plugin for that session. Free fallback files are provided in the fixture at `.nativeanimation-free/animations/`; the fixture prompt points there without preselecting a piece. No files are copied into the app's component directory before the agent acts. Remove retained temporary directories after review.
