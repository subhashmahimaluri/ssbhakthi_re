import Layout from '@/components/Layout/Layout';
import TithiList from '@/components/TithiList';
import { useTranslation } from '@/hooks/useTranslation';
import { Col, Row } from 'react-bootstrap';

export default function Tithi() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="text-center">
              {t.panchangam.calender} {year}
            </h1>
            <p className="text-center">{t.panchangam.calender_desc}</p>
            <TithiList />
          </div>
        </Col>
        <Col xl="4" lg="4" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 mb-3 bg-white px-3 py-3 text-black">
            <h2>Sidebar</h2>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}
