import { STARTING_BANKROLL } from '@signal-or-noise/game-engine';

const DIFFICULTIES: {
  key: 'easy' | 'medium' | 'hard';
  label: string;
  explainer: string;
}[] = [
  { key: 'easy', label: 'Easy', explainer: '3 direct clues.' },
  { key: 'medium', label: 'Medium', explainer: '2 balanced clues.' },
  { key: 'hard', label: 'Hard', explainer: '1 abstract clue.' },
];

export default function ClassicSetupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-son-text">Classic Run</h1>
        <p className="mb-8 text-sm text-son-textSecondary">20 rounds. Choose your difficulty.</p>

        <div className="space-y-3">
          {DIFFICULTIES.map((d) => (
            <a
              key={d.key}
              href={`/play/classic/run?difficulty=${d.key}`}
              className="block rounded-2xl border border-son-border bg-son-card p-4 transition-colors hover:border-son-signalBlue/50"
            >
              <h2 className="text-lg font-semibold text-son-text">{d.label}</h2>
              <p className="mt-1 text-sm text-son-textSecondary">
                20 rounds &middot; Starting bankroll: $
                {STARTING_BANKROLL[d.key].toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-son-textMuted">{d.explainer}</p>
            </a>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-4">
          <h2 className="text-sm font-semibold text-son-text">How scoring works</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-son-textSecondary">
            <p>
              <strong className="text-son-text">Bankroll</strong> is your money score. Each
              round you stake a slice of it and earn the stock&apos;s real historical return
              &mdash; win big when the market moved big. A wrong All-In ends your run.
            </p>
            <p>
              <strong className="text-son-text">Signal Score</strong> measures how well you
              read the market: bolder correct calls score higher (+1 to +5), wrong calls cost
              the same, and passing costs 0.25. Name the hidden company for +2 &mdash; but a
              wrong name costs 1.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
