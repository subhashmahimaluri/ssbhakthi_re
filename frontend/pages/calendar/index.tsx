import Layout from '@/components/Layout/Layout';
import MonthlyCalendar from '@/components/MonthlyCalendarV2';
import { useTranslation } from '@/hooks/useTranslation';

export default function Calendar() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <Layout>
      <div className="container-fluid py-5">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="mb-4 text-center">
              <h1>
                {(t.panchangam as any).calender || 'Telugu Panchangam Calendar'} {year}
              </h1>
              <p className="text-muted">
                {(t.panchangam as any).calender_desc ||
                  'Monthly view of Telugu Panchangam with daily astronomical information'}
              </p>
            </div>
            <MonthlyCalendar />
          </div>
        </div>
      </div>
    </Layout>
  );
}
