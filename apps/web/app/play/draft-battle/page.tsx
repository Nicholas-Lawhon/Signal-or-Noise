'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type {
  DraftBattleInvitePreviewPayload,
  DraftBattleStatePayload,
  DraftCardPayload,
} from '@signal-or-noise/shared-types';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney, formatPercent } from '@/lib/format';
import Sparkline from '@/components/Sparkline';
import { capture } from '@/lib/analytics';

type Format = 'classic' | 'quick' | 'era';

const picksFor = (format: Format) => format === 'quick' ? 2 : 3;
const equalWeights = (picks: number) => picks === 2 ? [50, 50] : [30, 30, 40];

// Only the changed card moves; the player balances to 100% themselves
// (the submit button stays disabled until the total is exactly 100%).
function withAllocation(current: number[], changedIndex: number, changedValue: number): number[] {
  return current.map((value, index) => (index === changedIndex ? changedValue : value));
}

function formatCountdown(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function BattleCard({ card, selected, disabled, onToggle }: {
  card: DraftCardPayload;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      aria-pressed={selected}
      className={`rounded-xl border p-3 text-left ${selected ? 'border-son-signalCyan bg-son-signalCyan/10' : 'border-son-border bg-son-card'} disabled:opacity-50`}
    >
      <p className="text-xs text-son-textMuted">Card {card.slot + 1} &middot; {card.decisionDateLabel}</p>
      <p className="mt-1 font-semibold text-son-text">{card.title}</p>
      <p className="mt-1 text-xs text-son-textSecondary">{card.companyDescription}</p>
      <div className="mt-2"><Sparkline prices={card.lookbackChart.map((point) => point.price)} height={48} variant="lookback" /></div>
      <span className="mt-2 inline-block text-xs font-semibold text-son-signalCyan">{selected ? 'Selected' : 'Select card'}</span>
    </button>
  );
}

function DraftBattleClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useUser();
  // Acceptance tests use mocked endpoints; production builds never set this UI-only flag.
  const canUseSignedInUi = isSignedIn || process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === 'true';
  const invite = searchParams.get('invite') ?? '';
  const battleId = searchParams.get('battleId') ?? '';
  const [battle, setBattle] = useState<DraftBattleStatePayload | null>(null);
  const [invitePreview, setInvitePreview] = useState<DraftBattleInvitePreviewPayload | null>(null);
  const [format, setFormat] = useState<Format>('classic');
  const [timer, setTimer] = useState<120 | 300 | null>(120);
  const [eraId, setEraId] = useState('');
  const [eras, setEras] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [allocations, setAllocations] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const picks = picksFor(battle?.format ?? format);

  const acceptBattle = useCallback((next: DraftBattleStatePayload) => {
    setBattle(next);
    setServerOffset(new Date(next.serverNow).getTime() - Date.now());
  }, []);

  const load = useCallback(async (id: string) => {
    try {
      acceptBattle((await api.draftBattleState(id)).battle);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load this Draft Battle.');
    }
  }, [acceptBattle]);

  useEffect(() => {
    void api.draftEras().then((response) => setEras(response.eras)).catch(() => undefined);
    if (battleId) {
      void load(battleId);
      const interval = window.setInterval(() => void load(battleId), 2_000);
      return () => window.clearInterval(interval);
    }
    if (invite) {
      void api.draftBattleInvite(invite)
        .then((response) => setInvitePreview(response.invite))
        .catch((caught) => setError(caught instanceof Error ? caught.message : 'This invite is unavailable.'));
    }
    return undefined;
  }, [battleId, invite, load]);

  useEffect(() => {
    if (!battle?.submissionDeadlineAt || battle.status !== 'awaiting_submissions') return;
    const interval = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [battle?.status, battle?.submissionDeadlineAt]);

  const remainingMilliseconds = useMemo(() => battle?.submissionDeadlineAt
    ? new Date(battle.submissionDeadlineAt).getTime() - (clock + serverOffset)
    : null, [battle?.submissionDeadlineAt, clock, serverOffset]);

  const toggle = (slot: number) => {
    setSelected((current) => {
      if (current.includes(slot)) {
        const next = current.filter((value) => value !== slot);
        setAllocations(next.length === picks ? equalWeights(picks) : []);
        return next;
      }
      if (current.length >= picks) return current;
      const next = [...current, slot].sort((a, b) => a - b);
      setAllocations(next.length === picks ? equalWeights(picks) : []);
      return next;
    });
  };

  const create = async () => {
    if (!canUseSignedInUi || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await api.createDraftBattle(format, timer, format === 'era' ? eraId : undefined);
      acceptBattle(created.battle);
      router.replace(`/play/draft-battle?battleId=${encodeURIComponent(created.battle.id)}`);
      capture({ name: 'draft_battle_created', properties: { format } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create a Draft Battle.');
    } finally { setBusy(false); }
  };

  const join = async () => {
    if (!invite || busy) return;
    setBusy(true); setError(null);
    try {
      const joined = await api.joinDraftBattle(invite);
      acceptBattle(joined.battle);
      router.replace(`/play/draft-battle?battleId=${encodeURIComponent(joined.battle.id)}`);
      capture({ name: 'draft_battle_joined', properties: { format: joined.battle.format } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not join this Draft Battle.');
    } finally { setBusy(false); }
  };

  const submit = async (slots: number[], weights: number[]) => {
    if (!battle || slots.length !== picks || weights.reduce((sum, value) => sum + value, 0) !== 100 || busy) return;
    setBusy(true); setError(null);
    try {
      acceptBattle((await api.submitDraftBattle(battle.id, slots, weights)).battle);
      capture({ name: 'draft_battle_submitted', properties: { format: battle.format } });
    } catch (caught) {
      setError(caught instanceof ApiRequestError ? caught.message : 'Could not submit your portfolio.');
    } finally { setBusy(false); }
  };

  if (!isLoaded && process.env.NEXT_PUBLIC_E2E_MOCK_AUTH !== 'true') {
    return <main id="main-content" className="page-shell"><p className="text-center text-sm text-son-textMuted">Checking your session...</p></main>;
  }
  if (!canUseSignedInUi) return <main id="main-content" className="page-shell"><div className="mx-auto max-w-xl rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">Draft Battle</p><h1 className="mt-2 text-2xl font-bold">Sign in to play</h1><p className="mt-2 text-sm text-son-textSecondary">Draft Battles are private two-player matches. Solo Draft remains available to guests.</p></div></main>;
  if (!battle && invite) return <main id="main-content" className="page-shell"><div className="mx-auto max-w-xl rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">Opaque invite</p><h1 className="mt-2 text-2xl font-bold">Join Draft Battle</h1><p className="mt-2 text-sm text-son-textSecondary">Both players receive the same cards. Choices remain private until settlement.</p>{invitePreview ? <p className="mt-3 rounded-lg bg-son-surface px-3 py-2 text-xs capitalize text-son-textSecondary">{invitePreview.format} Draft &middot; Timer {invitePreview.timerSeconds === null ? 'off' : `${invitePreview.timerSeconds / 60} minutes`}</p> : null}{error ? <p role="alert" className="mt-3 text-sm text-son-red">{error}</p> : null}<button type="button" disabled={busy || (invitePreview !== null && !invitePreview.joinable)} onClick={() => void join()} className="mt-5 w-full rounded-lg bg-son-signalBlue px-4 py-3 font-semibold text-son-textInverse disabled:opacity-60">{busy ? 'Joining...' : 'Join battle'}</button></div></main>;
  if (!battle) return <main id="main-content" className="page-shell"><div className="mx-auto max-w-xl rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">Two signed-in players</p><h1 className="mt-2 text-2xl font-bold">Draft Battle</h1><p className="mt-2 text-sm text-son-textSecondary">Create an opaque invite, send it to one player, and both privately build a weighted portfolio.</p><div className="mt-5 grid grid-cols-3 gap-2">{(['classic', 'quick', 'era'] as Format[]).map((candidate) => <button key={candidate} type="button" onClick={() => setFormat(candidate)} aria-pressed={format === candidate} className={`min-h-11 rounded-lg border p-2 text-xs font-semibold capitalize ${format === candidate ? 'border-son-signalCyan bg-son-signalCyan/10' : 'border-son-border'}`}>{candidate}</button>)}</div>{format === 'era' ? <label className="mt-4 block text-sm text-son-textSecondary">Era<select value={eraId} onChange={(event) => setEraId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-son-border bg-son-card px-3 text-son-text"><option value="">Choose an era</option>{eras.map((era) => <option key={era.id} value={era.id}>{era.name}</option>)}</select></label> : null}<label className="mt-4 block text-sm text-son-textSecondary">Timer<select value={timer === null ? 'off' : timer} onChange={(event) => setTimer(event.target.value === 'off' ? null : Number(event.target.value) as 120 | 300)} className="mt-1 min-h-11 w-full rounded-lg border border-son-border bg-son-card px-3 text-son-text"><option value={120}>2 minutes</option><option value={300}>5 minutes</option><option value="off">Off</option></select></label>{error ? <p role="alert" className="mt-3 text-sm text-son-red">{error}</p> : null}<button type="button" disabled={busy || (format === 'era' && !eraId)} onClick={() => void create()} className="mt-5 w-full rounded-lg bg-son-signalBlue px-4 py-3 font-semibold text-son-textInverse disabled:opacity-60">{busy ? 'Dealing...' : 'Create invite'}</button></div></main>;

  const ownSelected = selected.length ? selected : (battle.you.selectedSlots ?? []);
  if (battle.status === 'awaiting_opponent') {
    const inviteUrl = typeof window === 'undefined' ? '' : `${window.location.origin}/play/draft-battle?invite=${encodeURIComponent(battle.inviteCode ?? '')}`;
    return <main id="main-content" className="page-shell"><div className="mx-auto max-w-xl rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">Invite created</p><h1 className="mt-2 text-2xl font-bold">Waiting for your opponent</h1><p className="mt-2 text-sm text-son-textSecondary">Share this opaque invite link. The battle expires after 24 hours.</p><p className="mt-4 break-all rounded-lg bg-son-surface p-3 font-mono text-xs text-son-signalCyan">{inviteUrl}</p><button type="button" onClick={() => void navigator.clipboard.writeText(inviteUrl).then(() => setCopied(true))} className="mt-3 min-h-11 w-full rounded-lg border border-son-border bg-son-surface px-4 py-2 text-sm font-semibold text-son-textSecondary">{copied ? 'Invite copied' : 'Copy invite link'}</button><p className="mt-3 text-xs capitalize text-son-textMuted">Format: {battle.format} &middot; Timer: {battle.timerSeconds === null ? 'off' : `${battle.timerSeconds / 60} minutes`}</p></div></main>;
  }
  if (battle.status === 'expired' || battle.status === 'completed') return <main id="main-content" className="page-shell"><div className="mx-auto max-w-2xl rounded-2xl border border-son-border bg-son-card p-5"><p className="eyebrow">Draft Battle settled</p><h1 className="mt-2 text-3xl font-bold">{battle.outcome === 'you_won' ? 'You won' : battle.outcome === 'you_lost' ? 'You lost' : battle.outcome === 'draw' ? 'Draw' : 'No winner'}</h1><p className="mt-2 text-sm text-son-textSecondary">{battle.status === 'expired' ? 'The 24-hour battle window expired.' : 'Both portfolios are now visible.'}</p>{battle.reveal ? <div className="mt-5 space-y-2">{battle.reveal.companies.map((company) => <div key={company.slot} className="flex items-center justify-between gap-3 rounded-lg border border-son-border bg-son-surface px-3 py-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-son-text">{company.companyName} <span className="font-normal text-son-textMuted">{company.ticker}</span></p><p className="text-xs text-son-textMuted">{company.youSelected ? <span className="block">{`You · ${company.youAllocationPercent}%`}</span> : null}{company.opponentSelected ? <span className="block">{`Opponent · ${company.opponentAllocationPercent}%`}</span> : null}{!company.youSelected && !company.opponentSelected ? 'Not selected' : null}</p></div><p className="font-bold tabular-nums text-son-text">{formatPercent(company.actualReturnPercent)}</p></div>)}</div> : null}{battle.reveal ? <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs"><div className="rounded-lg bg-son-surface p-3"><p className="font-bold text-son-text">{battle.reveal.you.finalValue === null ? 'Forfeit' : formatMoney(battle.reveal.you.finalValue)}</p><p className="text-son-textMuted">You</p></div><div className="rounded-lg bg-son-surface p-3"><p className="font-bold text-son-text">{battle.reveal.opponent?.finalValue === null ? 'Forfeit' : formatMoney(battle.reveal.opponent?.finalValue ?? 0)}</p><p className="text-son-textMuted">Opponent</p></div></div> : null}</div></main>;

  const cards = battle.cards ?? [];
  const currentAllocations = allocations.length ? allocations : (battle.you.allocations ?? (ownSelected.length === picks ? equalWeights(picks) : []));
  return <main id="main-content" className="page-shell pb-36"><div className="mx-auto max-w-4xl"><div className="mb-4 rounded-lg border border-son-border bg-son-card px-4 py-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold capitalize text-son-text">{battle.format} Draft Battle</span><span className="text-son-textSecondary">{battle.opponent?.hasSubmitted ? 'Opponent submitted' : 'Opponent is choosing'}</span></div><p className="mt-1 text-xs text-son-textMuted">Your choices stay private until both portfolios settle. {remainingMilliseconds === null ? 'Timer off.' : `Time left: ${formatCountdown(remainingMilliseconds)}`} Missing the deadline forfeits.</p></div>{battle.you.hasSubmitted ? <div className="rounded-lg border border-son-signalCyan/50 bg-son-signalCyan/10 p-4 text-sm text-son-textSecondary">Your portfolio is locked. Waiting for the opponent; reconnecting automatically.</div> : <><div className="grid gap-3 md:grid-cols-2">{cards.map((card) => <BattleCard key={card.slot} card={card} selected={ownSelected.includes(card.slot)} disabled={ownSelected.length >= picks} onToggle={() => toggle(card.slot)} />)}</div><div className="mt-4 rounded-lg border border-son-border bg-son-card p-4"><p className="text-sm font-semibold text-son-text">Allocate the full {formatMoney(battle.budget)}</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{ownSelected.map((slot, index) => <label key={slot} className="flex items-center justify-between gap-2 rounded-lg bg-son-surface px-3 py-2 text-xs text-son-textSecondary">Card {slot + 1}<select aria-label={`Allocation for card ${slot + 1}`} value={currentAllocations[index] ?? 10} onChange={(event) => setAllocations(withAllocation(currentAllocations, index, Number(event.target.value)))} className="min-h-11 rounded border border-son-border bg-son-card px-2 text-son-text">{[10, 20, 30, 40, 50, 60].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>)}</div><p className="mt-2 text-xs text-son-textMuted">Allocated: {currentAllocations.reduce((sum, value) => sum + value, 0)}% &middot; equal shortcut {equalWeights(picks).join(' / ')}</p></div></>}</div><div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 border-t border-son-border bg-son-bg/95 px-4 py-3 backdrop-blur lg:bottom-0"><div className="mx-auto max-w-4xl"><button type="button" disabled={busy || battle.you.hasSubmitted || ownSelected.length !== picks || currentAllocations.reduce((sum, value) => sum + value, 0) !== 100} onClick={() => void submit(ownSelected, currentAllocations)} className="w-full rounded-lg bg-son-signalBlue px-5 py-3 font-semibold text-son-textInverse disabled:bg-son-surface disabled:text-son-textMuted">{busy ? 'Submitting...' : 'Submit private portfolio'}</button></div></div>{error ? <p role="alert" className="mx-auto mt-4 max-w-4xl text-sm text-son-red">{error}</p> : null}</main>;
}

export default function DraftBattlePage() {
  return <Suspense fallback={<main id="main-content" className="flex min-h-screen items-center justify-center bg-son-bg"><p className="text-son-textMuted">Loading Draft Battle...</p></main>}><DraftBattleClient /></Suspense>;
}
