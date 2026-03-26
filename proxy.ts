import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/editor(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Emergency Kill Switch via Vercel Edge Config
  try {
    const isMaintenanceMode = await get('maintenance');
    if (isMaintenanceMode) {
      const url = req.nextUrl;
      if (!url.pathname.startsWith('/maintenance')) {
        return NextResponse.rewrite(new URL('/maintenance', req.url));
      }
    }
  } catch (error) {
    // Fail open if Edge Config fails to load
    console.error('Failed to fetch from Edge Config:', error);
  }

  // Emergency Kill Switch via ENV variable (fallback)
  if (process.env.EMERGENCY_KILL_SWITCH === 'true') {
    const url = req.nextUrl;
    // Exclude the maintenance route itself to prevent infinite redirect loops
    if (!url.pathname.startsWith('/maintenance')) {
      return NextResponse.rewrite(new URL('/maintenance', req.url));
    }
  }

  // Regular protected routes check
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, images, favicons, API routes, and maintenance
    '/((?!_next|api|trpc|maintenance|favicon\\.ico|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
