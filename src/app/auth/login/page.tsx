import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in to Questlog</h1>
      <LoginForm />
    </div>
  );
}
