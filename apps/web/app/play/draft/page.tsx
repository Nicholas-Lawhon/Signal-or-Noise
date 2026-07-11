'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type {
  CompletedDraftPayload,
  CurrentDraftPayload,
  DraftCardPayload,
} from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney, formatPercent, formatSignedMoney } from '@/lib/format';
import Sparkline from '@/components/Sparkline';

type View = 'loading' | 'intro' | 'pick' | 'reveal' | 'error';

function DraftCard({
  card,
  selected,
  disabled,
  onToggle,
}: {
  card: DraftCardPayload;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        selected ? 'border-son-signalCyan bg-son-signalCyan/5' : 'border-son-border bg-son-card'
      }`}
    >
      <p className="text-xs text-son-textMuted">
        {card.decisionDateLabel} &middot; {card.holdingPeriodLabel}
      </p>
      <h3 className="mt-0.5 text-base font-semibold text-son-text">{card.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
        {card.companyDescription}
      </p>
      <div className="mt-3">
        <Sparkline
          prices={card.lookbackChart.map((point) => point.price)}
          height={64}
          variant="lookback"
        />
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-son-textSecondary">
          <p className="text-son-textMuted">{card.macroContext}</p>
          <p>{card.situation}</p>
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-son-textMuted">
              Why it might work
            </p>
            <p>{card.longCase}</p>
          </div>
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-son-textMuted">
              What could break
            </p>
            <p>{card.shortCase}</p>
          </div>
          {card.setupHints.length > 0 ? (
            <ul className="list-inside list-disc space-y-1">
              {card.setupHints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex-1 rounded-lg border border-son-border bg-son-surface px-3 py-2 text-xs font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
        >
          {expanded ? 'Hide the full case' : 'Read the full case'}
        </button>
        <button
          type="button"
          disabled={disabled && !selected}
          onClick={onToggle}
          className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
            selected
              ? 'border-son-signalCyan bg-son-signalCyan/10 text-son-signalCyan'
              : disabled
                ? 'cursor-not-allowed border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted'
                : 'border-son-border bg-son-surface text-son-textSecondary hover:border-son-borderStrong'
          }`}
        >
          {selected ? 'Drafted — tap to drop' : 'Draft this company'}
        </button>
      </div>
    </div>
  );
}

function DraftClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();

  const [view, setView] = useState<View>('loading');
  const [draft, setDraft] = useState<CurrentDraftPayload | null>(null);
  const [result, setResult] = useState<CompletedDraftPayload | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bootedRef = useRef(false);

  const showReveal = useCallback(
    (payload: CompletedDraftPayload) => {
      setResult(payload);
      setView('reveal');
      router.replace(`/play/draft?draftId=${encodeURIComponent(payload.id)}`);
    },
    [router],
  );

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const draftIdParam = searchParams.get('draftId');
    void (async () => {
      try {
        if (draftIdParam) {
          const loaded = await api.draft(draftIdParam);
          if (loaded.draft.status === 'completed') {
            setResult(loaded.draft);
            setView('reveal');
          } else {
            setDraft(loaded.draft);
            setView('pick');
          }
          return;
        }
        const current = await api.currentDraft();
        if (current.draft) {
          setDraft(current.draft);
          setView('pick');
          return;
        }
        setView('intro');
      } catch (error) {
        setFatalError(error instanceof Error ? error.message : 'Something went wrong');
        setView('error');
      }
    })();
  }, [searchParams]);

  const startDraft = async () => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const created = await api.createDraft();
      setDraft(created.draft);
      setSelected([]);
      setResult(null);
      setView('pick');
      router.replace('/play/draft');
    } catch (error) {
      setActionError(
        error instanceof ApiRequestError && error.status !== 500
          ? error.message
          : 'Could not start a draft. Try again.',
      );
      if (view === 'loading') setView('intro');
    } finally {
      setBusy(false);
    }
  };

  const toggleSlot = (slot: number) => {
    setSelected((current) =>
      current.includes(slot)
        ? current.filter((value) => value !== slot)
        : current.length < 3
          ? [...current, slot]
          : current,
    );
  };

  const lockPicks = async () => {
    if (!draft || selected.length !== 3 || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const completed = await api.submitDraftSelections(draft.id, [...selected].sort());
      showReveal(completed.draft);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        // Already locked (double tap / second tab): load the reveal.
        try {
          const reloaded = await api.draft(draft.id);
          if (reloaded.draft.status === 'completed') {
            showReveal(reloaded.draft);
            return;
          }
        } catch {
          // fall through to the retryable error
        }
      }
      setActionError(
        error instanceof ApiRequestError && error.status !== 500
          ? error.message
          : 'Could not lock your picks. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (view === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-son-bg">
        <p className="text-son-textMuted">Loading your draft...</p>
      </main>
    );
  }

  if (view === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-son-textSecondary">
          {fatalError ?? 'Something went wrong.'}
        </p>
        <a
          href="/play/draft"
          className="rounded-lg border border-son-border bg-son-card px-4 py-2 text-sm font-semibold text-son-textSecondary hover:border-son-borderStrong"
        >
          Back to Portfolio Draft
        </a>
      </main>
    );
  }

  if (view === 'intro') {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
            Six hidden companies. One window.
          </p>
          <h1 className="mt-1 text-3xl font-bold text-son-text">Portfolio Draft</h1>
          <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
            Read six hidden companies from the same slice of market history. Draft the three
            you think performed best — a fictional {formatMoney(10000)} splits equally across
            your picks, and the reveal shows how close you came to the optimal portfolio.
          </p>
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">6</p>
                <p className="mt-1 text-son-textMuted">Companies</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">3</p>
                <p className="mt-1 text-son-textMuted">Picks</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">{formatMoney(10000)}</p>
                <p className="mt-1 text-son-textMuted">Budget</p>
              </div>
            </div>
            {actionError ? (
              <p className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
                {actionError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void startDraft()}
              className="mt-5 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Dealing the cards...' : 'Start a Draft'}
            </button>
            {!isSignedIn ? (
              <p className="mt-3 text-center text-xs text-son-textMuted">
                Guests can play. Sign in first and your finished drafts save to your account.
              </p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  if (view === 'pick' && draft) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6 pb-28">
        <div className="w-full max-w-md">
          <div className="mb-4 rounded-lg border border-son-border bg-son-card px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-son-text">Portfolio Draft</span>
              <span className="text-son-textSecondary">
                Window: <span className="font-semibold text-son-text">{draft.windowLabel}</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-son-textMuted">
              Draft the 3 best performers. {formatMoney(draft.budget)} splits equally across
              your picks.
            </p>
            {!draft.isOfficial ? (
              <p className="mt-1 text-xs text-son-textMuted">
                Guest draft — sign in before starting a draft to save results.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            {draft.cards.map((card) => (
              <DraftCard
                key={card.slot}
                card={card}
                selected={selected.includes(card.slot)}
                disabled={selected.length >= 3}
                onToggle={() => toggleSlot(card.slot)}
              />
            ))}
          </div>

          {actionError ? (
            <p className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
              {actionError}
            </p>
          ) : null}
        </div>

        {/* Sticky lock-in bar */}
        <div className="fixed inset-x-0 bottom-0 border-t border-son-border bg-son-bg/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              disabled={selected.length !== 3 || busy}
              onClick={() => void lockPicks()}
              className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
                selected.length === 3 && !busy
                  ? 'bg-son-signalBlue text-son-textInverse hover:brightness-110'
                  : 'cursor-not-allowed bg-son-surface text-son-textMuted'
              }`}
            >
              {busy ? 'Locking...' : `Lock in picks (${selected.length}/3)`}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (view === 'reveal' && result) {
    const beat = result.finalValue - result.budget;
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
              Draft complete &middot; {result.windowLabel}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-son-text tabular-nums">
              {formatMoney(result.finalValue)}
            </h1>
            <p className="mt-1 text-sm text-son-textSecondary">
              Your {formatMoney(result.budget)} portfolio {beat >= 0 ? 'grew' : 'shrank'} by{' '}
              <span className={beat >= 0 ? 'font-semibold text-son-green' : 'font-semibold text-son-red'}>
                {formatSignedMoney(beat)}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">
                  {formatMoney(result.optimalValue)}
                </p>
                <p className="mt-1 text-son-textMuted">Optimal portfolio</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p
                  className={`font-bold tabular-nums ${
                    result.gapFromOptimal <= 0.005 ? 'text-son-green' : 'text-son-amber'
                  }`}
                >
                  {result.gapFromOptimal <= 0.005
                    ? 'Perfect draft'
                    : formatMoney(result.gapFromOptimal)}
                </p>
                <p className="mt-1 text-son-textMuted">
                  {result.gapFromOptimal <= 0.005 ? 'You found the signal' : 'Gap from optimal'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {result.companies.map((company) => (
                <div
                  key={company.slot}
                  className={`rounded-lg border px-3 py-2.5 ${
                    company.selected
                      ? 'border-son-signalCyan/60 bg-son-signalCyan/5'
                      : 'border-son-border bg-son-surface/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-son-text">
                        {company.companyName}{' '}
                        <span className="font-normal text-son-textMuted">{company.ticker}</span>
                      </p>
                      <p className="truncate text-xs text-son-textMuted">{company.title}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          company.actualReturnPercent > 0
                            ? 'text-son-green'
                            : company.actualReturnPercent < 0
                              ? 'text-son-red'
                              : 'text-son-textSecondary'
                        }`}
                      >
                        {formatPercent(company.actualReturnPercent)}
                      </p>
                      {company.selected && company.sliceValue !== null ? (
                        <p className="text-xs tabular-nums text-son-textSecondary">
                          {formatMoney(company.sliceValue)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {(company.selected || company.optimal) && (
                    <div className="mt-1.5 flex gap-1.5">
                      {company.selected ? (
                        <span className="rounded-full border border-son-signalCyan/50 bg-son-signalCyan/10 px-2 py-0.5 text-[10px] font-semibold text-son-signalCyan">
                          Your pick
                        </span>
                      ) : null}
                      {company.optimal ? (
                        <span className="rounded-full border border-son-green/50 bg-son-green/10 px-2 py-0.5 text-[10px] font-semibold text-son-green">
                          Optimal 3
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {result.isOfficial ? (
            <p className="mt-3 inline-block rounded-full border border-son-green/50 bg-son-green/10 px-3 py-0.5 text-xs font-semibold text-son-green">
              Saved to your account
            </p>
          ) : (
            <p className="mt-3 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
              Guest draft &mdash; sign in before your next draft to save it
            </p>
          )}

          {actionError ? (
            <p className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
              {actionError}
            </p>
          ) : null}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void startDraft()}
              className="flex-1 rounded-lg bg-son-signalBlue px-4 py-3 text-center text-sm font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Dealing...' : 'Draft again'}
            </button>
            <a
              href="/"
              className="flex-1 rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return null;
}

export default function PortfolioDraftPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-son-bg">
          <p className="text-son-textMuted">Loading...</p>
        </main>
      }
    >
      <DraftClient />
    </Suspense>
  );
}
