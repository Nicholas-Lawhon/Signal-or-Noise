/**
 * Company-guess matching shared by every mode that supports Call the Company.
 * Normalization strips case and punctuation so "Coca-Cola" matches "coca cola".
 */
export function normalizeCompanyGuess(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function guessIsCorrect(
  guess: string | undefined,
  company: { companyName: string; ticker: string; acceptedNames: string[] },
): boolean | null {
  if (!guess) return null;
  const accepted = [company.companyName, company.ticker, ...company.acceptedNames]
    .map(normalizeCompanyGuess);
  return accepted.includes(normalizeCompanyGuess(guess));
}
