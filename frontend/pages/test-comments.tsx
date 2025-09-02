import Layout from '@/components/Layout/Layout';
import CommentSection from '@/components/comments/CommentSection';
import { Col, Row } from 'react-bootstrap';

export default function TestComments() {
  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
            <div className="mb-4">
              <h1 className="text-primary mb-4">Test Comments Functionality</h1>
              <p className="text-muted mb-4">
                This is a test page to verify the comments functionality works correctly. The
                canonical slug "test-article" is used for testing purposes.
              </p>

              <div className="alert alert-info">
                <strong>Note:</strong> This page uses a test canonical slug that may not exist in
                the database. You should see proper error handling if content doesn't exist.
              </div>
            </div>

            {/* Test Comments Section */}
            <CommentSection contentType="article" canonicalSlug="test-article" />
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>Test Info</h2>
            <ul>
              <li>Content Type: Article</li>
              <li>Canonical Slug: test-article</li>
              <li>Comments should display "Content not found" error gracefully</li>
              <li>Login functionality should work properly</li>
              <li>Error messages should appear in UI instead of alerts</li>
            </ul>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
