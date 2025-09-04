'use client';
import Layout from '@/components/Layout/Layout';
import PanchangamTable from '@/components/PanchangamTable';
import UpcomingEvents from '@/components/UpcomingEvents';
import { Col, Row } from 'react-bootstrap';

export default function PanchangamPage() {
  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <PanchangamTable />
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <UpcomingEvents />
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
