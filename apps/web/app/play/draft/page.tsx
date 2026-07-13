'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type { CompletedDraftPayload, CurrentDraftPayload, DraftCardPayload } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney, formatPercent, formatSignedMoney } from '@/lib/format';
import Sparkline from '@/components/Sparkline';
import { capture } from '@/lib/analytics';

type DraftFormat = 'classic' | 'quick' | 'era';
type View = 'loading' | 'intro' | 'pick' | 'reveal' | 'error';

function picksFor(format: DraftFormat): number { return format === 'quick' ? 2 : 3; }
function poolFor(format: DraftFormat): number { return format === 'quick' ? 4 : 6; }
function equalAllocations(picks: number): number[] {
  if (picks === 2) return [50, 50];
  return [30, 30, 40];
}

function DraftCard({ card, selected, disabled, allocation, onAllocation, onToggle }: {
  card: DraftCardPayload;
  selected: boolean;
  disabled: boolean;
  allocation: number | null;
  onAllocation: (value: number) => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <div className={`rounded-2xl border p-4 transition-colors ${selected ? 'border-son-signalCyan bg-son-signalCyan/5' : 'border-son-border bg-son-card'}`}>
    <p className="text-xs text-son-textMuted">{card.decisionDateLabel} · {card.holdingPeriodLabel}</p>
    <h3 className="mt-0.5 text-base font-semibold text-son-text">{card.title}</h3>
    <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">{card.companyDescription}</p>
    <div className="mt-3"><Sparkline prices={card.lookbackChart.map((point) => point.price)} height={64} variant="lookback" /></div>
    {expanded ? <div className="mt-3 space-y-2 text-sm leading-relaxed text-son-textSecondary">
      <p className="text-son-textMuted">{card.macroContext}</p><p>{card.situation}</p>
      <p><span className="font-medium text-son-textMuted">Why it might work: </span>{card.longCase}</p>
      <p><span className="font-medium text-son-textMuted">What could break: </span>{card.shortCase}</p>
      {card.setupHints.length > 0 ? <ul className="list-inside list-disc">{card.setupHints.map((hint) => <li key={hint}>{hint}</li>)}</ul> : null}
    </div> : null}
    <div className="mt-3 flex gap-2">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="min-h-11 flex-1 rounded-lg border border-son-border bg-son-surface px-3 py-2 text-xs font-semibold text-son-textSecondary">{expanded ? 'Hide case' : 'Read full case'}</button>
      <button type="button" aria-pressed={selected} disabled={disabled && !selected} onClick={onToggle} className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${selected ? 'border-son-signalCyan bg-son-signalCyan/10 text-son-signalCyan' : disabled ? 'border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted' : 'border-son-border bg-son-surface text-son-textSecondary'}`}>{selected ? 'Drafted · tap to drop' : 'Draft this company'}</button>
    </div>
    {selected ? <label className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-son-surface px-3 py-2 text-xs text-son-textSecondary">Allocation
      <select aria-label={`Allocation for ${card.title}`} value={allocation ?? 10} onChange={(event) => onAllocation(Number(event.target.value))} className="min-h-10 rounded-md border border-son-border bg-son-card px-2 font-semibold text-son-text">
        {[10, 20, 30, 40, 50, 60].map((value) => <option key={value} value={value}>{value}%</option>)}
      </select>
    </label> : null}
  </div>;
}

function DraftClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const [view, setView] = useState<View>('loading');
  const [draft, setDraft] = useState<CurrentDraftPayload | null>(null);
  const [result, setResult] = useState<CompletedDraftPayload | null>(null);
  const [format, setFormat] = useState<DraftFormat>('classic');
  const [eraId, setEraId] = useState('');
  const [eras, setEras] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [allocations, setAllocations] = useState<number[]>([]);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bootedRef = useRef(false);
  const picks = picksFor(draft?.format ?? format);

  const showReveal = useCallback((payload: CompletedDraftPayload) => {
    setResult(payload); setView('reveal'); router.replace(`/play/draft?draftId=${encodeURIComponent(payload.id)}`);
  }, [router]);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    void (async () => {
      try {
        const [eraResult, draftIdParam] = await Promise.all([api.draftEras(), Promise.resolve(searchParams.get('draftId'))]);
        setEras(eraResult.eras);
        if (draftIdParam) {
          const loaded = await api.draft(draftIdParam);
          if (loaded.draft.status === 'completed') { setResult(loaded.draft); setView('reveal'); }
          else { setDraft(loaded.draft); setFormat(loaded.draft.format); setEraId(loaded.draft.eraId ?? ''); setView('pick'); }
          return;
        }
        const current = await api.currentDraft();
        if (current.draft) { setDraft(current.draft); setFormat(current.draft.format); setEraId(current.draft.eraId ?? ''); setView('pick'); }
        else setView('intro');
      } catch (error) { setFatalError(error instanceof Error ? error.message : 'Something went wrong'); setView('error'); }
    })();
  }, [searchParams]);

  const startDraft = async () => {
    if (busy || (format === 'era' && !eraId)) return;
    setBusy(true); setActionError(null);
    try {
      const created = await api.createDraft(format, format === 'era' ? eraId : undefined);
      capture({ name: 'draft_started', properties: { format } });
      setDraft(created.draft); setSelected([]); setAllocations([]); setResult(null); setView('pick'); router.replace('/play/draft');
    } catch (error) { setActionError(error instanceof ApiRequestError && error.status !== 500 ? error.message : 'Could not start a draft. Try again.'); setView('intro'); }
    finally { setBusy(false); }
  };

  const toggleSlot = (slot: number) => {
    setSelected((current) => {
      if (current.includes(slot)) {
        const next = current.filter((value) => value !== slot);
        setAllocations(next.length === 0 ? [] : equalAllocations(next.length));
        return next;
      }
      if (current.length >= picks) return current;
      const next = [...current, slot].sort((a, b) => a - b);
      setAllocations(equalAllocations(next.length));
      return next;
    });
  };

  // Only the changed company moves; the player balances to 100% themselves
  // (the lock button stays disabled until the total is exactly 100%).
  const setAllocation = (slot: number, value: number) => {
    const index = selected.indexOf(slot);
    if (index < 0) return;
    setAllocations((current) => current.map((allocation, i) => (i === index ? value : allocation)));
  };

  const lockPicks = async () => {
    if (!draft || selected.length !== picks || allocations.length !== picks || allocations.reduce((sum, value) => sum + value, 0) !== 100 || busy) return;
    setBusy(true); setActionError(null);
    try {
      const completed = await api.submitDraftSelections(draft.id, selected, allocations);
      capture({ name: 'draft_completed', properties: { format: draft.format } }); showReveal(completed.draft);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) { try { const reloaded = await api.draft(draft.id); if (reloaded.draft.status === 'completed') { showReveal(reloaded.draft); return; } } catch { /* show retry */ } }
      setActionError(error instanceof ApiRequestError && error.status !== 500 ? error.message : 'Could not lock your portfolio. Check your connection and try again.');
    } finally { setBusy(false); }
  };

  if (view === 'loading') return <main id="main-content" className="flex min-h-screen items-center justify-center bg-son-bg"><p className="text-son-textMuted">Loading your Draft...</p></main>;
  if (view === 'error') return <main id="main-content" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"><p className="text-center text-sm text-son-textSecondary">{fatalError ?? 'Something went wrong.'}</p><a href="/play/draft" className="rounded-lg border border-son-border bg-son-card px-4 py-2 text-sm">Try again</a></main>;
  if (view === 'intro') return <main id="main-content" className="page-shell"><div className="mx-auto w-full max-w-3xl">
    <p className="eyebrow">Three ways to read the same kind of signal</p><h1 className="mt-2 text-3xl font-bold">Portfolio Draft</h1>
    <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">Choose a format, select the hidden companies you believe will win, then allocate all of your fictional {formatMoney(10000)} in 10% increments. The server reveals the returns, the best valid portfolio, and your gap.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-3">{(['classic', 'quick', 'era'] as DraftFormat[]).map((candidate) => <button key={candidate} type="button" onClick={() => setFormat(candidate)} aria-pressed={format === candidate} className={`rounded-xl border p-3 text-left ${format === candidate ? 'border-son-signalCyan bg-son-signalCyan/10' : 'border-son-border bg-son-card'}`}><p className="font-bold text-son-text">{candidate === 'classic' ? 'Classic Draft' : candidate === 'quick' ? 'Quick Draft' : 'Era Draft'}</p><p className="mt-1 text-xs text-son-textMuted">{poolFor(candidate)} cards · choose {picksFor(candidate)}</p></button>)}</div>
    {format === 'era' ? <label className="mt-4 block text-sm text-son-textSecondary">Era<select value={eraId} onChange={(event) => setEraId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-son-border bg-son-card px-3 text-son-text"><option value="">Choose a compatible era</option>{eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}</select></label> : null}
    <div className="mt-5 rounded-2xl border border-son-border bg-son-card p-5"><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-son-surface px-2 py-3"><p className="font-bold text-son-text">{poolFor(format)}</p><p className="mt-1 text-son-textMuted">Companies</p></div><div className="rounded-lg bg-son-surface px-2 py-3"><p className="font-bold text-son-text">{picksFor(format)}</p><p className="mt-1 text-son-textMuted">Picks</p></div><div className="rounded-lg bg-son-surface px-2 py-3"><p className="font-bold text-son-text">10%</p><p className="mt-1 text-son-textMuted">Min allocation</p></div></div>{actionError ? <p role="alert" className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">{actionError}</p> : null}<button type="button" disabled={busy || (format === 'era' && !eraId)} onClick={() => void startDraft()} className="mt-5 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse disabled:opacity-60">{busy ? 'Dealing the cards...' : 'Start a Draft'}</button>{!isSignedIn ? <p className="mt-3 text-center text-xs text-son-textMuted">Guests may play. Sign in before a Draft to save it to the official leaderboard.</p> : null}</div>
  </div></main>;
  if (view === 'pick' && draft) return <main id="main-content" className="page-shell pb-44"><div className="mx-auto w-full max-w-4xl">
    <div className="mb-4 rounded-lg border border-son-border bg-son-card px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold text-son-text">{draft.format === 'quick' ? 'Quick Draft' : draft.format === 'era' ? 'Era Draft' : 'Classic Draft'}</span><span className="text-son-textSecondary">Window: <span className="font-semibold text-son-text">{draft.windowLabel}</span></span></div><p className="mt-1 text-xs text-son-textMuted">Choose {picks} of {draft.cards.length}, then allocate exactly 100% in 10% increments. Equal weight shortcut: {equalAllocations(picks).join(' / ')}.</p>{!draft.isOfficial ? <p className="mt-1 text-xs text-son-textMuted">Guest Draft — finish it now; sign in before your next Draft to save results.</p> : null}</div>
    <div className="grid gap-3 md:grid-cols-2">{draft.cards.map((card) => <DraftCard key={card.slot} card={card} selected={selected.includes(card.slot)} disabled={selected.length >= picks} allocation={allocations[selected.indexOf(card.slot)] ?? null} onAllocation={(value) => setAllocation(card.slot, value)} onToggle={() => toggleSlot(card.slot)} />)}</div>
    {actionError ? <p role="alert" className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">{actionError}</p> : null}
  </div><div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-son-border bg-son-bg/95 px-4 py-3 backdrop-blur lg:bottom-0"><div className="mx-auto w-full max-w-4xl"><div className="mb-2 text-center text-xs text-son-textMuted">Allocated: {allocations.reduce((sum, value) => sum + value, 0)}% · {selected.length}/{picks} picked</div><button type="button" disabled={selected.length !== picks || allocations.reduce((sum, value) => sum + value, 0) !== 100 || busy} onClick={() => void lockPicks()} className="w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse disabled:cursor-not-allowed disabled:bg-son-surface disabled:text-son-textMuted">{busy ? 'Locking...' : 'Lock in portfolio'}</button></div></div></main>;
  if (view === 'reveal' && result) return <main id="main-content" className="page-shell signal-enter" aria-live="polite"><div className="mx-auto w-full max-w-3xl"><div className="rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">{result.format === 'quick' ? 'Quick' : result.format === 'era' ? 'Era' : 'Classic'} Draft complete · {result.windowLabel}</p><h1 className="mt-1 text-3xl font-bold tabular-nums">{formatMoney(result.finalValue)}</h1><p className="mt-1 text-sm text-son-textSecondary">Your portfolio {result.finalValue >= result.budget ? 'grew' : 'shrank'} by <span className={result.finalValue >= result.budget ? 'font-semibold text-son-green' : 'font-semibold text-son-red'}>{formatSignedMoney(result.finalValue - result.budget)}</span>.</p><div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs"><div className="rounded-lg bg-son-surface px-2 py-3"><p className="font-bold tabular-nums text-son-text">{formatMoney(result.optimalValue)}</p><p className="mt-1 text-son-textMuted">Best valid portfolio</p></div><div className="rounded-lg bg-son-surface px-2 py-3"><p className="font-bold tabular-nums text-son-text">{result.gapFromOptimal <= 0.005 ? 'Perfect draft' : formatMoney(result.gapFromOptimal)}</p><p className="mt-1 text-son-textMuted">Gap from optimal</p></div></div><div className="mt-5 space-y-2">{result.companies.map((company) => <div key={company.slot} className={`rounded-lg border px-3 py-2.5 ${company.selected ? 'border-son-signalCyan/60 bg-son-signalCyan/5' : 'border-son-border bg-son-surface/50'}`}><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-son-text">{company.companyName} <span className="font-normal text-son-textMuted">{company.ticker}</span></p><p className="truncate text-xs text-son-textMuted">{company.title}</p></div><div className="text-right"><p className={`text-sm font-bold tabular-nums ${company.actualReturnPercent > 0 ? 'text-son-green' : company.actualReturnPercent < 0 ? 'text-son-red' : 'text-son-textSecondary'}`}>{formatPercent(company.actualReturnPercent)}</p>{company.selected ? <p className="text-xs text-son-textSecondary">{company.allocationPercent ?? 'Equal'}% · {formatMoney(company.allocatedValue ?? 0)}</p> : null}</div></div><div className="mt-1.5 flex gap-1.5">{company.selected ? <span className="rounded-full border border-son-signalCyan/50 bg-son-signalCyan/10 px-2 py-0.5 text-[10px] font-semibold text-son-signalCyan">Your pick</span> : null}{company.optimal ? <span className="rounded-full border border-son-green/50 bg-son-green/10 px-2 py-0.5 text-[10px] font-semibold text-son-green">{company.optimalAllocationPercent === undefined ? 'Optimal' : `Optimal · ${company.optimalAllocationPercent}%`}</span> : null}</div></div>)}</div></div>{result.isOfficial ? <p className="mt-3 inline-block rounded-full border border-son-green/50 bg-son-green/10 px-3 py-0.5 text-xs font-semibold text-son-green">Saved to your {result.format} leaderboard</p> : <p className="mt-3 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">Guest Draft — unofficial</p>}<div className="mt-4 flex gap-3"><button type="button" disabled={busy} onClick={() => void startDraft()} className="flex-1 rounded-lg bg-son-signalBlue px-4 py-3 text-sm font-semibold text-son-textInverse">Draft again</button><a href="/leaderboards?board=draft" className="flex-1 rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary">Leaderboards</a></div></div></main>;
  return null;
}

export default function PortfolioDraftPage() {
  return <Suspense fallback={<main id="main-content" className="flex min-h-screen items-center justify-center bg-son-bg"><p className="text-son-textMuted">Loading...</p></main>}><DraftClient /></Suspense>;
}
