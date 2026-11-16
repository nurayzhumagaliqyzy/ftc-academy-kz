# Responsive QA — 2026-11-16

Base: `main` at `c953494b47f73d00e5dd101d3c066f42fd47c688` (includes QA-01).

## Scope and changes

This is a CSS-only layout update. Educational content, device rules, assessment models,
routes, JavaScript and localStorage keys/migrations are unchanged.

- Homepage cards use two columns from 621–1120 CSS px, one column at 620 px and below,
  and the existing three columns above 1120 px. Section headings and the footer can wrap.
- Small-screen Hardware buttons/links have at least 44 px height. Wiring disconnect
  buttons occupy a separate row so cable and port names have more room.
- Integrated Mission Lab explicitly defines five equal grid rows. Robot and landmark
  share the same grid area, instead of creating additional implicit rows inside a cell.
  Small-screen command reorder/delete buttons measure 44 × 44 px.

## Real browser checks

Desktop Chromium rendered the actual app in a temporary same-origin iframe with widths
320, 390, 768 and 1440 CSS px. This tests real CSS media queries and DOM geometry,
not physical mobile devices or touch emulation. Classic Chromium scrollbars use 15 px
of the iframe width: document client widths were 305, 375, 753 and 1425 px.
The temporary QA page is excluded from the commit and production build.

All 15 routes were opened at each width, waiting for the expected lesson heading or
Hardware section before measurement: home, five Hardware sections, Programming overview,
and all eight lessons. The 60 route/width checks passed:

| CSS viewport | Routes loaded | Document horizontal overflow | Clipped control contents |
| --- | --- | --- | --- |
| 320 px | 15/15 PASS | None detected | None detected |
| 390 px | 15/15 PASS | None detected | None detected |
| 768 px | 15/15 PASS | None detected | None detected |
| 1440 px | 15/15 PASS | None detected | None detected |

Overflow was checked using document scrollWidth versus clientWidth. Control content was
checked using scrollWidth versus clientWidth for visible buttons, inputs and selects
(2 px tolerance). These measurements are not a comprehensive visual/accessibility audit.
Screenshots were inspected for the 320 px Mission Lab and Gamepad Lab, the 768 px homepage,
and an additional 901 px Gamepad layout. The 1440 px checks were DOM geometry checks;
the browser's outer visible window was narrower than the test iframe.

### Confirmed defect and regression check

At 320 px, the Mission Lab's five row heights were **56, 23, 58, 23, 81 px**.
The grid was square overall but its cells were distorted by intrinsic content sizing.
After the change, all five rows measured approximately **48.2 px**. Rows were also equal
at 390, 768 and 1440 px (subpixel rounding below 0.02 px), and the robot stayed inside its cell.

Reproduce: open `#programming/integrated-challenge`, choose mission 1, and inspect the
5×5 field at 320 px. All rows and columns should have equal dimensions, including the
row containing the robot. Repeat after moving the robot.

### Interaction smoke checks at 320 px

- PASS: mobile menu opens, Escape closes it, and selecting Programming opens the overview
  and closes the menu. All eight lessons were reached through their shared lesson links.
- PASS: Hardware Explorer opens Control Hub details.
- PASS: Wiring DC Motor → Motor 0 succeeds; disconnect control measures 44 px high.
  Tab to clear-all → Enter clears connections and focuses DC Motor with focus-visible;
  next Tab focuses Motor Encoder (QA-01 regression).
- PASS: Servo slider keyboard End sets 1.00; reset restores 0.50.
- PASS: Sensor NaN option commands zero power; reset restores the valid default command.
- PASS: Encoder accepts target −100 from current +200; one step reaches +140 with
  −240 remaining; encoder reset produces current/target/remaining zero.
- PASS: Mission 1 `Open Claw, Forward, Forward, Close Claw, Stop` succeeds with the object
  carried at (2,4). Run, Pause, Resume, Step and Reset were exercised. A two-command
  sequence without Stop failed. Progress summary persisted across browser reload.
- PASS: Teacher Mode's 375 px table scrolls within its 219 px container using ArrowRight;
  the document remains 305 px wide without page-level horizontal scrolling.
- No application-origin errors appeared in the inspected captured console error window.
  Browser-extension metadata errors were excluded from application results.

## Automated checks

- `npm test`: **111 passed**, 0 failed/skipped.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**. Main JS 672.47 kB / 183.57 kB gzip; the existing >500 kB
  chunk warning remains. CSS 39.83 kB / 9.91 kB gzip.
- `git diff --check`: **PASS**.

The existing Node tests cover lesson models, scoring, progress and routes; they do not
test CSS rendering or DOM focus. No model-only test is claimed as responsive coverage.

## Limits

NOT TESTED: physical phone/tablet touch, Safari/Firefox, screen reader, OS reduced-motion
switching, landscape/virtual keyboard, browser zoom/text enlargement, and a complete
manual rerun of every quiz/scenario/challenge. Existing automated assessment tests passed.
Hosted Vercel preview interactions were not part of these local browser checks.

Before merging, a reviewer can repeat the viewport matrix in browser responsive mode,
check the field after moving the robot, open the mobile menu, and connect/disconnect a
cable. Physical touch and non-Chromium checks remain useful follow-up verification.
