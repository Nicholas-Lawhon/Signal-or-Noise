# Phase 4B — Production Content Expansion

**Status:** accepted
**Risk:** high — production content quality and validation
**Owner:** Orchestrator; internal implementation subagents authorized at GPT 5.6
Sol Medium
**Branch/worktree:** continue the current dirty checkout for the already-present
legacy WIP; do not migrate, discard, or commit it midstream. Future clean phases
should use a dedicated non-main branch/worktree.

## Outcome

Complete Phase 4B as one campaign: 40 production-ready scenario cards matching
D034's 24 famous / 12 moderate / 4 obscure mix, plus 10 daily-challenge pools and
10 famous market eras. All cards must pass the production content pipeline and be
ready for the single final human/orchestrator phase review and activation.

## Starting Context

- D022, D026, and D031-D038 in
  `agents/history/decisions_phase_0_4.md`
- `docs/09_content_and_round_creation.md`
- `packages/content/src/schema.ts`, content validator, and Gate 2 implementation
- Current active and draft scenarios under `packages/content/scenarios/`
- Current draft inventory; H037 results are contaminated legacy evidence because
  their judge input exposed answer-bearing scenario IDs and must not be used

Treat H034-H037 reports and handoffs as legacy provenance. Do not load them unless
the current data/results leave a specific ambiguity.

## Delegated Authority

- Organize authoring into internal batches for attention and verification.
- Choose candidates within the D034 mix and source-quality rules.
- Repair, retire, or replace any failed candidate without per-card escalation.
- Run independent blind Gate 2 using an approved model; the authoring context must
  not contaminate the blind judge.
- Use opaque judge IDs, withhold the answer mapping, and judge sibling difficulty
  variants in separate clean sessions.
- After one repair/rejudge attempt, prefer retiring/replacing persistent identity
  failures instead of creating another workflow loop.
- Add the minimum pool/era data structures required by the existing content
  architecture; make reversible implementation choices without asking.

## Stop Conditions

- A required change would alter locked game/content rules or the D034 mix.
- Required market/reveal facts cannot be sourced to D038 quality.
- External credentials, paid services, publishing, or irreversible action is
  required.
- The acceptance target cannot be met after replacing failed candidates.

## Exclusions

- Database persistence, auth, leaderboards, and Daily Challenge gameplay code.
- Activating content before final human/orchestrator phase review.
- Changes to scoring, `soul.md`, or unrelated web/game-engine code.
- New per-batch H###/R### artifacts, dispatch approvals, or orchestrator reviews.

## Acceptance Criteria

1. Exactly 40 production candidates match the 24/12/4 recognition mix and pass
   the content validator with no blocking errors.
2. Every difficulty variant has current independent Gate 2 evidence and no
   unresolved identity failure; required WARNs are explicitly dispositioned.
3. Every card meets Balanced Tension, clue-count, source-quality, chart, market
   data, reveal, and internal-consistency rules from doc 09.
4. Ten daily-challenge pools and ten famous market eras are defined and validate
   against the chosen content representation.
5. Existing product tests pass and no draft is marked human-reviewed/active before
   final phase review.
6. A final content inventory makes the phase reviewer able to approve or reject
   the complete set without reading legacy workflow reports.

## Final Verification

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check --include-draft
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
```

Run any additional pool/era validator added by the phase. When all criteria pass,
update `progress.md` current state and write
`agents/phase-closeouts/P04B_content_expansion.md`. Do not create intermediate
handoffs, reports, or reviews.
