'use client';

import AuthProvider from '@/components/providers/SessionProvider';
import { Button, Card, Col, Row } from 'react-bootstrap';

function MediaContent() {
  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>Media Library</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary">Upload Files</Button>
        </Col>
      </Row>

      <Card>
        <Card.Body className="py-5 text-center">
          <h4>Media Library</h4>
          <p className="text-muted">
            Media management functionality will be implemented here. This will include file uploads,
            organization, and management.
          </p>
          <Button variant="outline-primary">Coming Soon</Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default function MediaPage() {
  return (
    <AuthProvider>
      <MediaContent />
    </AuthProvider>
  );
}
