import { PageTransition } from "@/components/page-transition";

export default function CheckEmailPage() {
  return (
    <PageTransition className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="max-w-sm text-zinc-500">
        We sent you a confirmation link. Click it to finish creating your account.
      </p>
    </PageTransition>
  );
}
