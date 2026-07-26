import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <SignUpForm />
    </div>
  );
}
