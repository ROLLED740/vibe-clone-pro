import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-24">
      <SignUp appearance={{ variables: { colorPrimary: '#06b6d4' } }} />
    </main>
  );
}
