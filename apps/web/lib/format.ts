export function formatMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString();
}

export function formatSignedMoney(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString();
}

export function formatPercent(decimal: number): string {
  const pct = decimal * 100;
  const sign = pct > 0 ? '+' : '';
  return sign + pct.toFixed(1) + '%';
}

export function formatSignalScore(n: number): string {
  if (n > 0) return '+' + n;
  if (n === 0) return '0';
  return n.toString();
}
