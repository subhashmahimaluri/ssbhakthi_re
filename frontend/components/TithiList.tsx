// components/TithiList.tsx
import { useTranslation } from '@/hooks/useTranslation';
import { tithiMap } from '@/utils/tithiMap';
import Link from 'next/link';
import { Col, Row } from 'react-bootstrap';

type TithiListProps = {
  title?: string;
  currentTithi?: string; // slug format, e.g., 'padyami'
  year?: number | string;
};

export default function TithiList({ title, currentTithi, year }: TithiListProps) {
  const { t } = useTranslation();

  const resolvedYear = year || new Date().getFullYear();
  const tithiNames = Object.keys(tithiMap);

  return (
    <div className="pricing-card pe-xl-4 ps-xl-4 rounded-8 mb-5 bg-white pe-6 ps-6 pt-4">
      {title && (
        <h2 className="mb-6 text-center text-2xl font-bold">
          {title} - {year}
        </h2>
      )}
      <div className="price-content light-mode-texts">
        <Row className="mb-8">
          {tithiNames
            .filter(tithi => tithi !== currentTithi?.toLowerCase())
            .map((tithi, index) => (
              <Col key={index} sm="12" md="6" lg="3" xl="3" className="my-2 text-center">
                <Link
                  key={tithi}
                  href={`/calendar/tithi/${tithi}-${resolvedYear}`}
                  className="gr-hover-shadow-1 d-flex flex-column border px-2 py-2 text-center"
                >
                  {t.panchangam[tithi as keyof typeof t.panchangam] || tithi}
                </Link>
              </Col>
            ))}
        </Row>
      </div>
    </div>
  );
}
