import { auth } from '@clerk/nextjs/server';

export async function checkIsAdmin(): Promise<boolean> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === 'admin';
}
