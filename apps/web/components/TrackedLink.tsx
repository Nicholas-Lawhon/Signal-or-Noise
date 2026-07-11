'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { AnalyticsEvent } from '@/lib/analytics';
import { capture } from '@/lib/analytics';
export default function TrackedLink({ event, ...props }: ComponentProps<typeof Link> & { event: AnalyticsEvent }) { return <Link {...props} onClick={(click) => { capture(event); props.onClick?.(click); }} />; }
