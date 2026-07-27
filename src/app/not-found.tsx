import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";

export default function NotFound() {
  return (
    <PageTransition className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-zinc-500">
        This page doesn&apos;t exist, or it belongs to a tome that isn&apos;t on your shelf.
      </p>
      <Link href="/library" className={buttonVariants({ size: "sm" })}>
        Back to your library
      </Link>
    </PageTransition>
  );
}
