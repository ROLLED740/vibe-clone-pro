import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Everything else — landing, pricing, gallery — stays public.
const isProtectedRoute = createRouteMatcher(['/studio(.*)']);

// Stripe calls this, never a signed-in browser.
const isWebhook = createRouteMatcher(['/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhook(req)) return NextResponse.next();

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files.
    '/((?!_next|api|favicon\\.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|mp4|webm)).*)',
    // API routes must run through Clerk too, otherwise auth() has no context
    // inside route handlers and every authenticated endpoint throws.
    '/(api)(.*)',
  ],
};
