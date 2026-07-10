import { describe, expect, it } from 'vitest';
import { rankedGate2GuessesSchema } from '../src/gate2/resultValidation';

function guesses(confidences = [30, 25, 20, 15, 10]) {
  return confidences.map((confidence, index) => ({
    company: `Company ${index + 1}`,
    confidence,
    pointingFact: `Fact ${index + 1}`,
  }));
}

describe('rankedGate2GuessesSchema', () => {
  it('accepts five distinct guesses in non-increasing confidence order', () => {
    expect(rankedGate2GuessesSchema.safeParse(guesses([30, 25, 20, 20, 10])).success).toBe(true);
  });

  it('rejects the same company despite case and punctuation differences', () => {
    const input = guesses();
    input[4]!.company = 'COMPANY-1';
    expect(rankedGate2GuessesSchema.safeParse(input).success).toBe(false);
  });

  it('rejects guesses that increase in confidence after an earlier rank', () => {
    expect(rankedGate2GuessesSchema.safeParse(guesses([30, 25, 26, 15, 10])).success).toBe(false);
  });
});
