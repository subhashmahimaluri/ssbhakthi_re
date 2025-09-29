import Link from 'next/link';
import { useRouter } from 'next/router';
import { Container, Nav, Navbar } from 'react-bootstrap';

export default function AdminNav() {
  const router = useRouter();

  return (
    <Container className="pt-15">
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 py-5">
        <Container>
          <Navbar.Brand as={Link} href="/admin">
            🔐 Admin Panel
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={Link}
                href="/admin"
                className={router.pathname === '/admin' ? 'active' : ''}
              >
                Dashboard
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/admin/articles"
                className={router.pathname.startsWith('/admin/articles') ? 'active' : ''}
              >
                Articles
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/admin/add-article"
                className={router.pathname === '/admin/add-article' ? 'active' : ''}
              >
                Add Article
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/admin/stotras"
                className={router.pathname.startsWith('/admin/stotras') ? 'active' : ''}
              >
                Stotras
              </Nav.Link>
              <Nav.Link
                as={Link}
                href="/admin/add-stotra"
                className={router.pathname === '/admin/add-stotra' ? 'active' : ''}
              >
                Add Stotra
              </Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} href="/">
                ← Back to Site
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </Container>
  );
}
