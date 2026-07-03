type SparklineProps = {
  prices: number[];
  height?: number;
  variant?: 'lookback' | 'outcome';
};

export default function Sparkline({ prices, height = 96, variant = 'outcome' }: SparklineProps) {
  if (!prices || prices.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-son-textMuted">
        No chart data
      </div>
    );
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const width = 400;
  const h = height;
  const padding = 2;

  const points = prices
    .map((p, i) => {
      const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
      const y = h - padding - ((p - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  let color: string;
  if (variant === 'lookback') {
    color = '#38D5E6';
  } else {
    const growing = prices[prices.length - 1] >= prices[0];
    color = growing ? '#35D07F' : '#FF5C73';
  }

  return (
    <div style={{ width: '100%', height }}>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
