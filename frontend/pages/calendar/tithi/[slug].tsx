'use client';
import { useParams } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Row, Col } from 'react-bootstrap';
import { YexaaPanchang } from '@/lib/panchangam';
import { getTithiNumbersByName } from '@/utils/tithiMap';
import TithiList from '@/components/TithiList';
import LocationAccordion from '@/components/LocationAccordion';
import { capitalize, groupTithiByMonth, interpolate } from '@/utils/utils';
import TithiYearNavigation from '@/components/TithiYearNavigation';
import Layout from '@/components/Layout/Layout';
import { useLocation } from '@/context/LocationContext';
import { useTranslation } from '@/hooks/useTranslation';

type TithiInfo = {
  tithi: {
    name: string;
    name_en_IN: string;
    ino: number;
    start: string;
    end: string;
  };
  paksha: {
    name: string;
    name_en_IN: string;
  };
  masa: {
    name_en_IN: string;
  };
};

type TithiGroup = {
  month: string;
  tithiData: TithiInfo[];
};

export default function TithiPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [dates, setDates] = useState<TithiGroup[]>([]);
  const [tithiName, setTithiName] = useState<string>('');
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { t } = useTranslation();

  const { lat, lng, city, timezone, country, setLocationData } = useLocation();

  useEffect(() => {
    if (!slug) return;

    const [name, yearStr] = slug.split('-');
    const parsedYear = parseInt(yearStr, 10);
    const inos = getTithiNumbersByName(name.toLowerCase());

    if (!name || isNaN(parsedYear) || !inos || inos.length === 0) {
      console.error('Invalid Tithi name or year:', slug);
      setLoading(false);
      return;
    }

    const panchang = new YexaaPanchang();
    const allTithiDates = inos
      .map((ino: number) => panchang.getTithiDates(parsedYear, ino, lat, lng))
      .flat();
    const grouped = groupTithiByMonth(allTithiDates);

    setDates(grouped);
    setTithiName(name);
    setYear(parsedYear);
    setLoading(false);
  }, [slug, lng, lat]);

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block px-md-10 bg-white px-5 py-3 text-black">
            <h1 className="mb-2 text-xl font-bold">
              {t.panchangam[tithiName]} {t.panchangam.tithi} {year}
            </h1>
            <p className="mb-4">
              {interpolate(t.panchangam.tithi_list_desc, {
                year,
                tithiName: t.panchangam[tithiName],
                city,
                country,
              })}
            </p>
            <LocationAccordion city={city} country={country} />
            <table className="table-tith table-bordered border-gray mt-3 table">
              <tbody>
                {dates.map((date, index) => (
                  <Fragment key={index}>
                    <tr className="bg-gray-opacity text-cente">
                      <td colSpan={2}>
                        <h4 className="pt-3">
                          {interpolate(t.panchangam.tithi_list_month, {
                            tithi: t.panchangam[tithiName],
                            month: t.panchangam[date.month.toLowerCase()],
                          })}
                        </h4>
                      </td>
                    </tr>
                    {date.tithiData.map((tithi, idx) => (
                      <tr key={idx}>
                        <td>
                          {t.panchangam[tithi.masa.name_en_IN]}{' '}
                          {t.panchangam[tithi.paksha.name_en_IN]}{' '}
                          {t.panchangam[tithi.tithi.name_en_IN]}
                        </td>
                        <td>
                          {format(new Date(tithi.tithi.start), 'dd MMM yyyy hh:mm a')} –{' '}
                          {format(new Date(tithi.tithi.end), 'dd MMM yyyy hh:mm a')}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {year && <TithiYearNavigation tithiName={tithiName} currentYear={year} />}
            {year && <TithiList title="Other Tithi List" currentTithi={tithiName} year={year} />}
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
