# Signal or Noise? — OpenDesign Design Pack

This package contains design documentation intended for OpenDesign or an agentic design workflow.

## Recommended upload/use order

1. Upload or place `DESIGN.md` first.
2. Upload the rest of the markdown files.
3. Upload `04_design_tokens.json`.
4. Paste the prompt from `09_opendesign_generation_prompt.md` into OpenDesign.

## Files

- `DESIGN.md` — Main design contract and brand rules.
- `01_opendesign_project_brief.md` — Product/design brief.
- `02_screen_flow_spec.md` — Screen-by-screen requirements.
- `03_component_inventory.md` — Required components.
- `04_design_tokens.json` — Structured color, typography, spacing, motion, and game tokens.
- `05_mobile_wireframes.md` — Mobile low-fidelity wireframes.
- `06_desktop_wireframes.md` — Desktop low-fidelity wireframes.
- `07_interaction_and_motion_spec.md` — Motion and state behavior.
- `08_content_card_visual_schema.md` — Scenario card visual/content structure.
- `09_opendesign_generation_prompt.md` — Prompt to paste into OpenDesign.

## Design goal

Create a premium mobile-first web prototype for Signal or Noise? that feels like a modern market-history guessing game, not a brokerage app or finance dashboard.

## Important gameplay rules to preserve

- The chart before the decision is a lookback chart only.
- The outcome chart is shown only after reveal.
- Bankroll is the primary score.
- Signal Score is the secondary score.
- Confidence controls must calculate risk from current bankroll.
- Pass should be a real choice, not a disabled state.
- Difficulty changes clue detail, not scoring math.

