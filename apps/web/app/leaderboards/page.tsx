import LeaderboardHub from '@/components/LeaderboardHub';

type SearchParams = Record<string, string | string[] | undefined>;

function isUtcCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default function LeaderboardsPage({ searchParams }: { searchParams: SearchParams }) {
  const rawBoard = typeof searchParams.board === 'string' ? searchParams.board : 'daily';
  const initialBoard = rawBoard === 'classic' || rawBoard === 'signal' ? rawBoard : 'daily';
  const rawDifficulty = typeof searchParams.difficulty === 'string'
    ? searchParams.difficulty
    : 'easy';
  const initialDifficulty = rawDifficulty === 'medium' || rawDifficulty === 'hard'
    ? rawDifficulty
    : 'easy';
  const candidateDate = typeof searchParams.date === 'string' ? searchParams.date : '';
  const initialDate = isUtcCalendarDate(candidateDate)
    ? candidateDate
    : new Date().toISOString().slice(0, 10);
  const rawPage = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  const initialPage = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return (
    <main className="page-shell flex flex-col items-center">
      <LeaderboardHub
        initialBoard={initialBoard}
        initialDifficulty={initialDifficulty}
        initialDate={initialDate}
        initialPage={initialPage}
      />
    </main>
  );
}
