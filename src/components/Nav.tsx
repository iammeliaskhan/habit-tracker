import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Habit Tracker
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Today
          </Link>
          <Link
            href="/stats"
            className="rounded-md px-2 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Stats
          </Link>
        </nav>
      </div>
    </header>
  );
}
