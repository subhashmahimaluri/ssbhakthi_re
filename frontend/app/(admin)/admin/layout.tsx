'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Badge, Container, Dropdown, Nav, Navbar, Offcanvas } from 'react-bootstrap';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // Only redirect if we're sure there's no session and we're not already on signin page
    if (status === 'unauthenticated' && !window.location.pathname.includes('/auth/signin')) {
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    // If authenticated but no admin access, redirect to my-account
    if (session) {
      const userRoles = session.user.roles || [];
      const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

      if (!hasAdminAccess) {
        router.push('/my-account');
        return;
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session && status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  // Ensure session exists before proceeding
  if (!session) {
    return null;
  }

  const userRoles = session.user.roles || [];
  const isAdmin = userRoles.includes('admin');

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navigationItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/articles', label: 'Articles', icon: '📝' },
    { href: '/admin/media', label: 'Media', icon: '🖼️' },
    { href: '/admin/panchangam', label: 'Panchangam', icon: '📅' },
    ...(isAdmin ? [{ href: '/admin/users', label: 'Users', icon: '👥' }] : []),
  ];

  const SidebarContent = () => (
    <div className="h-100 bg-dark text-white">
      <div className="border-bottom border-secondary p-3">
        <h5 className="mb-0">Admin Panel</h5>
      </div>
      <Nav className="flex-column p-3">
        {navigationItems.map(item => (
          <Nav.Item key={item.href} className="mb-2">
            <Link
              href={item.href}
              className="nav-link text-white"
              style={{ textDecoration: 'none' }}
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Link>
          </Nav.Item>
        ))}
      </Nav>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Top Navigation Bar */}
      <Navbar bg="white" expand="lg" className="border-bottom shadow-sm">
        <Container fluid>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary d-lg-none me-3"
              onClick={() => setShowSidebar(true)}
            >
              ☰
            </button>
            <Navbar.Brand>
              <Link href="/" className="text-decoration-none text-dark">
                SSBhakthi Admin
              </Link>
            </Navbar.Brand>
          </div>

          <div className="d-flex align-items-center">
            <span className="text-muted me-2">Welcome, {session.user.name}</span>
            <div className="me-3">
              {userRoles.map(role => (
                <Badge key={role} bg="primary" className="me-1">
                  {role}
                </Badge>
              ))}
            </div>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-secondary" size="sm">
                👤
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item href="/admin/profile">Profile</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleSignOut}>Sign Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      <div className="d-flex">
        {/* Desktop Sidebar */}
        <div
          className="d-none d-lg-block"
          style={{ width: '250px', minHeight: 'calc(100vh - 56px)' }}
        >
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Admin Panel</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content */}
        <div className="flex-grow-1" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Container fluid className="py-4">
            {children}
          </Container>
        </div>
      </div>
    </div>
  );
}
