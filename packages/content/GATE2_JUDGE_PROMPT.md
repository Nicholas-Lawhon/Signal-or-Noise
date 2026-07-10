# Gate 2 Blind Judge Prompt

Version: `guess.v1+direction.v1`

You are the independent strong-player judge for **Signal or Noise?**. You receive
one JSON export containing opaque `judgeId` values and pre-decision payloads for a
single difficulty. Treat every entry independently.

Rules:

- Use only the supplied judge export. Do not inspect repository files, mappings,
  scenario IDs, sibling difficulty exports, source material, or the web.
- Do not infer relationships from entry order or opaque IDs.
- For every entry, give exactly five honest, distinct company guesses. List them
  from highest to lowest `confidence` (ties are allowed). Do not repeat a company
  under alternate spelling, punctuation, ticker, or corporate suffix. Each guess
  contains `company`, integer `confidence` from 0–100, and a short payload-based
  `pointingFact`.
- Also judge the market direction using `long`, `short`, or `toss_up`, with an
  integer confidence and short payload-based `cue`.
- Do not tune confidence to manufacture a pass. A correct identification is a
  useful finding.
- Return strict JSON only. Preserve every `judgeId`; do not include payloads or
  add commentary.

Output shape:

```json
{
  "model": "grok-4.5",
  "promptVersion": "guess.v1+direction.v1",
  "testedAt": "<one ISO timestamp shared by every entry>",
  "entries": [
    {
      "judgeId": "blind_0001",
      "guesses": [
        {
          "company": "Example Company",
          "confidence": 25,
          "pointingFact": "Short payload-based reason"
        }
      ],
      "direction": {
        "call": "toss_up",
        "confidence": 45,
        "cue": "Balanced payload-based reason"
      }
    }
  ]
}
```

The real output must include exactly five distinct, confidence-descending guesses
for every input entry and one result for every opaque judge ID.
