import { describe, expect, it } from 'vitest';
import { normalizeMojibake, normalizeMojibakeDeep } from '../src/textEncoding';

describe('text encoding normalization', () => {
  it('repairs one-pass and two-pass UTF-8 mojibake', () => {
    expect(normalizeMojibake('The companyâ€™s long case')).toBe("The company’s long case");
    expect(normalizeMojibake('A reset Ã¢â‚¬â€ then a recovery')).toBe('A reset — then a recovery');
    expect(normalizeMojibake('Confidence Ã‚Â±1')).toBe('Confidence ±1');
  });

  it('normalizes nested content without changing its shape', () => {
    const content = {
      title: 'Core Ã¢â‚¬â€ Horizon',
      reveal: { shortText: 'That was the companyâ€™s turn.' },
      points: ['2020', 12],
    };
    expect(normalizeMojibakeDeep(content)).toEqual({
      title: 'Core — Horizon',
      reveal: { shortText: 'That was the company’s turn.' },
      points: ['2020', 12],
    });
  });
});
