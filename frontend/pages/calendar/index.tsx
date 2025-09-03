import Layout from '@/components/Layout/Layout';
import MonthlyCalendar from '@/components/MonthlyCalendarV2';
import { useTranslation } from '@/hooks/useTranslation';
import { Row } from 'react-bootstrap';

export default function Calendar() {
  const { t } = useTranslation();

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <div className="container-fluid mt-10 py-5">
          <div className="row justify-content-center">
            <div className="col-12">
              <MonthlyCalendar />
            </div>
          </div>
        </div>
      </Row>
    </Layout>
  );
}
