import { PageTransition } from "@/components/page-transition";

export default function LibraryLoading() {
  return (
    <PageTransition className="flex flex-1 flex-col gap-8 px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        <div className="h-8 w-28 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
      </div>

      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-amber-900/5 p-8 dark:bg-amber-950/10">
        <div
          className="grid gap-x-6 gap-y-14"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="mx-auto h-[200px] w-[140px] animate-pulse rounded-[3px] bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
