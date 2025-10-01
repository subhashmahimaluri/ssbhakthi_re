'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function MyAccount() {
  const { data: session, status } = useSession();

  const handleSignIn = () => {
    signIn('keycloak', { callbackUrl: '/my-account' });
  };

  const handleSignOut = async () => {
    try {
      // Perform NextAuth signOut which will also trigger Keycloak logout
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      // Fallback: redirect manually if signOut fails
      window.location.href = '/';
    }
  };

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="my-account">
        <ul className="account-menu gr-text-10 gr-text-color gr-hover-text-orange contact mb-1 mt-1 py-1">
          <li>
            <span>Loading...</span>
          </li>
        </ul>
      </div>
    );
  }
  // Show unauthenticated state
  return (
    <div className="my-account">
      {session ? (
        <div className="account-menu gr-text-6 gr-text-color contact mb-1 mt-1 py-1">
          <Link href="/my-account" className="gr-hover-text-orange fw-bold gr-text-6 text-black">
            My Account
          </Link>
          {/* Show admin link if user has admin access */}
          {session.user?.roles?.some((role: string) =>
            ['admin', 'editor', 'author'].includes(role)
          ) && (
            <>
              <span className="mx-2">|</span>
              <Link href="/admin" className="gr-hover-text-orange fw-bold gr-text-6 text-black">
                Admin
              </Link>
            </>
          )}
          <span className="mx-2">|</span>
          <Link
            href="#"
            className="gr-hover-text-orange fw-bold gr-text-color text-black"
            onClick={handleSignOut}
          >
            Sign Out
          </Link>
        </div>
      ) : (
        <div className="account-menu gr-text-color contact mb-1 mt-1 py-1">
          <Link href="#" className="gr-hover-text-orange fw-bold text-black" onClick={handleSignIn}>
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
