import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // If accessing /admin/users and user doesn't have admin role
    if (pathname.startsWith('/admin/users') && !token?.roles?.includes('admin')) {
      // Redirect to /admin instead of showing 403
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to public pages
        if (!pathname.startsWith('/admin')) {
          return true;
        }

        // Require authentication for admin area
        if (!token) {
          return false;
        }

        // Check if user has required roles for admin access
        const userRoles = (token.roles as string[]) || [];
        const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

        if (!hasAdminAccess) {
          // Redirect to my-account instead of preventing access
          return false; // This will trigger redirect to signin, but admin layout will redirect to my-account
        }

        return hasAdminAccess;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
