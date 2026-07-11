import { CLASSIC_RUN_ROUNDS, STARTING_BANKROLL } from '@signal-or-noise/game-engine';
import ResumeRunCard from '@/components/ResumeRunCard';

const DIFFICULTIES: {
  key: 'easy' | 'medium' | 'hard';
  label: string;
  explainer: string;
}[] = [
  { key: 'easy', label: 'Easy', explainer: 'Balanced tension + 1 setup hint.' },
  { key: 'medium', label: 'Medium', explainer: 'Balanced tension + optional setup hint.' },
  { key: 'hard', label: 'Hard', explainer: 'Balanced tension only — no setup hints.' },
];

export default function ClassicSetupPage() {
  return (
    <main className="page-shell">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold text-son-text">Classic Run</h1>
        <p className="mb-8 text-sm text-son-textSecondary">
          Choose your difficulty and run length.
        </p>

        <ResumeRunCard />

        <div className="grid gap-3 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <a
              key={d.key}
              href={`/play/classic/run?difficulty=${d.key}`}
              className="block rounded-2xl border border-son-border bg-son-card p-4 transition-colors hover:border-son-signalBlue/50"
            >
              <h2 className="text-lg font-semibold text-son-text">{d.label}</h2>
              <p className="mt-1 text-sm text-son-textSecondary">
                {CLASSIC_RUN_ROUNDS[d.key]} rounds &middot; Starting bankroll: $
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
