'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dropdown } from 'react-bootstrap';

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
      console.error('Sign out error:', error);
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

  // Show authenticated state
  if (session) {
    const userRoles = session.user.roles || [];
    const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

    return (
      <div className="my-account">
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="link"
            className="text-decoration-none gr-text-10 gr-text-color gr-hover-text-orange"
            style={{ border: 'none', background: 'none', padding: '0.25rem' }}
          >
            {session.user.name || 'Account'} ▼
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.ItemText>
              <small className="text-muted">Roles: {userRoles.join(', ') || 'User'}</small>
            </Dropdown.ItemText>
            <Dropdown.Divider />

            <Dropdown.Item as={Link} href="/my-account">
              My Account
            </Dropdown.Item>

            {hasAdminAccess && (
              <>
                <Dropdown.Item as={Link} href="/admin">
                  Admin Panel
                </Dropdown.Item>
              </>
            )}

            <Dropdown.Divider />

            <Dropdown.Item href="#" onClick={handleSignOut}>
              Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }

  // Show unauthenticated state
  return (
    <div className="my-account">
      <ul className="account-menu gr-text-10 gr-text-color gr-hover-text-orange contact mb-1 mt-1 py-1">
        <li>
          <a href="#" onClick={handleSignIn}>
            Sign In
          </a>
        </li>
      </ul>
    </div>
  );
}
