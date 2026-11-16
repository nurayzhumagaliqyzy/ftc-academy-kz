# Robot Simulator QA · 16.11.2026

Scope: independent `/#simulator` module, based on main `96c928d98e4030cc63dcff25ca112cd87381a0ed` (merged Light/Dark theme, responsive fixes and QA-01). Existing graded lesson models were inspected before implementation. Their mission objectives, progress and command semantics were left unchanged. The new module shares the Point/Direction types and existing UI patterns; its two modes use one new pure command transition. A separate kernel avoids changing the graded state machines merely to support free practice and reverse movement.

## Automated checks

| Check | Result | Evidence / scope |
| --- | --- | --- |
| `npm test` | PASS | 142/142; 119 existing tests plus 23 simulator tests |
| `npm run typecheck` | PASS | TypeScript project checks |
| `npm run build` | PASS | Vite production build; existing >500 kB chunk warning remains |
| `git diff --check` | PASS | No whitespace errors |
| Movement/model | PASS | Four orientations, forward/reverse, turns without translation, field edges, walls, failed movement without counter increments |
| Sensor/Encoder | PASS | Current front free-cell count, stale snapshot, both IF branches, signed illustrative ticks, bounded trail |
| Object | PASS | Open-before-close pickup, carried position, release outside/inside target, no coordinate-only delivery, repeated close and re-pickup |
| Program | PASS | Reference delivery (17 commands), identical manual result, missing Stop ends normally, premature Stop skips tail, collision stops queue, invalid commands/prototype names, 48-command limit, editing/reordering |
| Lifecycle state | PASS | Pause/resume/step/Stop, three resets, mode isolation, fresh session |
| Timer adapter | PASS | Injected fake host: interval/listener removal, disposed callback guard, hidden/blur pause callbacks, queued callback guards after Stop/mode change |
| Routes/storage regression | PASS | Simulator route and eight existing lesson routes; all existing lesson completion/storage/migration tests still pass; new module has no storage API calls |

These are Node model/contract tests, **not React DOM focus or browser unmount instrumentation**. No new test library or runtime dependency was introduced. Bundle: JS 705.57 kB (192.59 kB gzip), CSS 55.51 kB (12.62 kB gzip). No bundle splitting was attempted in this scope.

## Real Chrome browser observations

Tested the local managed Vite preview, with mouse/DOM controls and actual keyboard events. Screenshots are unmodified browser captures: [Light](screenshots/simulator/light.jpg), [Dark](screenshots/simulator/dark.jpg).

| Check | Result | Actually performed |
| --- | --- | --- |
| Entry/navigation | PASS | Homepage “Симуляторды ашу”, sidebar simulator link, back-home link; module heading receives focus; reopening starts fresh |
| TeleOp | PASS | Focused keypad W moves one cell; W on the Forward button does not move; reverse, left turn, movement and Claw buttons work |
| Visible focus | PASS | Keyboard-focused button computed outline: 2 px teal; new keypad has scoped focus-visible outline; keyboard deletion restores focus to stable first palette button |
| Collision | PASS | At (2,5), E, Forward is blocked by (3,5), reports coordinates; turning left then moving succeeds |
| Pickup/release | PASS | Open → Forward ×2 → Close gives carried object; moving then Open leaves ground object at (2,4) |
| Full Autonomous delivery | PASS | Added all 17 reference commands via palette, Step, Run, Pause/Resume; final (5,1), N, open Claw, delivered object, 9 moves, +900 illustrative ticks |
| Editing/limit | PASS | 48 commands accepted, add buttons disabled; delete frees a slot; reorder changes first command; running disables editing |
| Pause/Stop | PASS | Paused index remains unchanged across subsequent inspection; global Stop leaves robot at start after later inspection; manual-mode switch cancels execution and preserves pose |
| Navigation cleanup | PASS | Started program then navigated home/reopened: new TeleOp state, (0,5), E, 0 moves/ticks, no previous last command |
| No Stop | PASS | One Forward program completes after Step without error/grade; no delivery indicated |
| Theme | PASS | Light/Dark switching; Light remains after reload; readable field, controls and telemetry in screenshots |
| Accessible structure | PASS (inspection) | Labelled SVG, text state summary, semantic headings/regions, telemetry dl, status/live feedback, named controls and pressed mode state observed in browser DOM |
| Application console | PASS (bounded inspection) | No local-app warning/error entries in inspected browser log. Browser-extension “Error sending browser metadata to extension” entries were present and are not application errors |

### Responsive viewport checks

Chrome tooling did not offer a top-level resize API. A temporary same-origin iframe harness set **real CSS viewport widths** to 320, 390, 768 and 1440 px; it was removed before the final build. Each width was measured in **both modes and both themes** (16 combinations). `documentElement.scrollWidth === clientWidth` and no simulator button rect extended beyond the content viewport in every combination. Browser scrollbar consumes 15 px, so measured content widths were 305/375/753/1425 px. Field widths in TeleOp were approximately 243/313/646/503 px. Narrow controls were visually inspected at 390 px and operated with mouse/keyboard. This is responsive browser testing, **not physical mobile/touch testing**.

## Source inspection and limitations

- Keyboard handler is local to the focusable TeleOp pad, rejects descendant targets, repeat and modifier shortcuts. There is no global movement listener.
- Playback effect returns adapter cleanup; reduced-motion listener also returns cleanup. Model movement depends only on commands, never elapsed time. Interval is presentation pacing (650 ms).
- Reduced-motion CSS and Run-disabled/Step-available branches were inspected; OS preference switching was **not tested in a real browser**. Hidden-tab/blur callbacks were tested with the injected host, not by manipulating a physical browser window.
- No screen reader, physical touch device, Safari/Firefox, full WCAG audit or exhaustive color-contrast certification was performed. Keyboard focus and accessible DOM semantics were observed; this does not establish assistive-technology compatibility on every platform.
- Earlier lesson automated tests pass and their model/storage files are unchanged. Every earlier lesson activity was **not manually replayed** during this feature task. Hardware WiringLab.tsx (including QA-01) and all migration files remain unchanged.
- No simulator persistence: leaving/reloading starts a fresh session; lesson and theme storage are outside this module. No invalid/NaN Sensor state is modeled: grid measurements are deterministic integers.
- Fixed field, four cardinal directions, one-cell actions, geometric collision checks, explicit Claw/object state; no physical units, real Encoder feedback, inertia, noise, drivetrain or motor dynamics. This module neither compiles/runs FTC Java nor connects to real hardware.
- Local screenshots/test results do not constitute a test of the hosted Vercel build. Preview deployment status and URL are reported in the PR when available.

## Demo

Open `/#simulator`. In TeleOp, Open Claw → Forward twice → Close Claw. Observe carried object and 0 free cells ahead. Forward is blocked; turn left to find a route. Reset the field and switch to Autonomous for the reference delivery:

```text
Open Claw, Forward, Forward, Close Claw, Read Distance, IF-OBSTACLE,
Forward, Forward, Turn Right, Forward, Forward, Forward,
Turn Left, Forward, Forward, Open Claw, Stop
```

Use Step to explain each state change, or Run/Pause/Resume. Correct release, rather than merely reaching T, produces delivery feedback. All three exploration suggestions remain optional and ungraded.
