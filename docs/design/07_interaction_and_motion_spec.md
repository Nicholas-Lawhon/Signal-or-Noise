# Signal or Noise? — Interaction and Motion Specification

## Gameplay pacing

The core loop should be quick and repeatable.

Target feel:

- Read.
- Decide.
- Lock.
- Reveal.
- Continue.

The player should never feel trapped in a slow animation or a long educational detour.

## Card transitions

Between rounds:

- Current card slides out.
- Next card slides in.
- Transition should feel like moving through a deck of scenario cards.

Recommended duration:

- 220ms to 420ms.

Reduced motion:

- Use a simple fade and content replacement.

## Lock-in interaction

When player taps Lock In Call:

1. Button compresses slightly.
2. Selected call and confidence are confirmed.
3. Scenario card enters locked state.
4. Brief signal/noise visual treatment appears.
5. Reveal becomes available or automatically opens.

Avoid casino-style anticipation.

## Reveal interaction

Reveal should feel like hidden information resolving into clarity.

Possible visual metaphors:

- Noise/static fades into company name.
- Blurred ticker resolves.
- Chart line extends into outcome period.
- Card flips from hidden side to reveal side.

Keep it clean and premium.

## Bankroll animation

After reveal:

- Previous bankroll count animates to new bankroll.
- Gain/loss delta appears beside it.
- Positive, negative, and neutral states are clear.

Do not use excessive confetti. Use restrained celebration for major wins.

## Confidence selector behavior

When user selects confidence:

- Button becomes selected.
- Amount at risk updates.
- Signal Score impact is visible.
- All-In should have a clear warning feel without being scary.

All-In microcopy example:

Everything on this call.

## Pass behavior

When user selects Pass:

- Confidence selector may be disabled or hidden because no bankroll is risked.
- UI should show that Pass has no bankroll change but slightly reduces Signal Score.
- Pass should not feel like a broken/no-op button.

Suggested copy:

Skip the call. Bankroll stays flat. Signal Score takes a small hit.

## Bankruptcy state

When bankroll hits $0:

- Show clear run-ended state.
- Avoid shame-heavy copy.
- Show final stats.
- Offer Start New Run.

Suggested copy:

Wiped out. The run ends here.

Buttons:

- Start New Run.
- Try Daily Challenge.
- View Summary.

## Leaderboard movement

After a completed daily challenge or saved run:

- If user is logged in, show rank and movement.
- If guest, show login prompt to save score.

Motion should be subtle.

## Loading states

Use skeleton cards or a subtle signal scan.

Examples:

- Loading scenario.
- Preparing reveal.
- Saving score.
- Loading leaderboard.

Do not use generic spinning loaders as the primary pattern if a skeleton or themed loader would work better.

