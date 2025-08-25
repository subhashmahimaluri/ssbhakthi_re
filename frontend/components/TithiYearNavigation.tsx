import { useTranslation } from '@/hooks/useTranslation';
import { capitalize } from '@/utils/utils';
import Link from 'next/link';
import { Row, Col } from 'react-bootstrap';

export default function TithiYearNavigation({
  tithiName,
  currentYear,
}: {
  tithiName: string;
  currentYear: number;
}) {
  const prevYear = currentYear - 1;
  const nextYear = currentYear + 1;

  const { t } = useTranslation();

  return (
    <Row className="my-2">
      <Col xl="6" lg="6" md="6" className="my-2 py-2 text-start">
        <Link href={`/calendar/tithi/${tithiName.toLowerCase()}-${prevYear}`} className="fw-bold">
          <span className="fw-bold text-xl">← </span>
          <span>
            {t.panchangam[tithiName]} {prevYear}
          </span>
        </Link>
      </Col>
      <Col xl="6" lg="6" md="6" className="my-2 py-2 text-end">
        <Link href={`/calendar/tithi/${tithiName.toLowerCase()}-${nextYear}`} className="fw-bold">
          <span>
            {t.panchangam[tithiName]} {nextYear}
          </span>
          <span className="fw-bold text-xl"> →</span>
        </Link>
      </Col>
    </Row>
  );
}
