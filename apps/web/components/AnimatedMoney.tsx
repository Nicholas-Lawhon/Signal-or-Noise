'use client';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/format';
export default function AnimatedMoney({ from, to }: { from: number; to: number }) { const [value, setValue] = useState(from); useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(to); return; } const started = performance.now(); let frame = 0; const tick = (now: number) => { const p = Math.min(1, (now - started) / 650); setValue(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [from, to]); return <span className="tabular-nums">{formatMoney(value)}</span>; }
