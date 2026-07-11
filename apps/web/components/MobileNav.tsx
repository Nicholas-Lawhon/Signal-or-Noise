'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [['/','Home'],['/play','Play'],['/leaderboards','Ranks'],['/profile','Profile']] as const;
export default function MobileNav() {
  const pathname = usePathname();
  return <nav aria-label="Primary mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-son-border bg-son-bg/95 px-[max(1rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"><div className="mx-auto grid max-w-md grid-cols-4">{links.map(([href,label]) => { const active = href === '/' ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 items-center justify-center text-xs font-bold ${active ? 'text-son-signalCyan' : 'text-son-textMuted'}`}>{label}</Link>; })}</div></nav>;
}
