"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, signInWithOAuth } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signup, undefined);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-zinc-500">or continue with</span>
        <Separator className="flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        <form action={signInWithOAuth.bind(null, "google")}>
          <Button type="submit" variant="outline" className="w-full">
            Google
          </Button>
        </form>
        <form action={signInWithOAuth.bind(null, "discord")}>
          <Button type="submit" variant="outline" className="w-full">
            Discord
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
