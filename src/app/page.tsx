import { PageTransition } from "@/components/page-transition";

export default function Home() {
  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Questlog
      </h1>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-500">
        Archive of played worlds
      </p>
      <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
        A digital museum for your gaming life. Under construction.
      </p>
    </PageTransition>
  );
}
