import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-24">
      <SignIn appearance={{ variables: { colorPrimary: '#06b6d4' } }} />
    </main>
  );
}
