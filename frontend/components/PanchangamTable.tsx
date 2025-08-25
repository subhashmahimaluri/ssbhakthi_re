import React, { useEffect, useState } from 'react';
import { YexaaPanchang } from '../lib/panchangam';
import { moonRiseSet, ITRFCoord } from '@/lib/moonRiseSet';
import {
  formatDay,
  formatFullDate,
  formatMonth,
  formatTimeIST,
  startEndDateFormat,
} from '@/utils/utils';
import Link from 'next/link';
import { Collapse } from 'react-bootstrap';
import AutoComplete from './AutoComplete';
import { useLocation } from '@/context/LocationContext';
import { MoonTime, PanchangamData, SunTime } from '@/types/panchangam';
import { useTranslation } from '@/hooks/useTranslation';
import { format, addDays } from 'date-fns';
import imgSprite from '../assets/images/icons/panchangam_sprite.png';
import PanchangSlide from './PanchangSlide';

interface PanchangamProps {
  date?: string | Date;
}

export default function PanchangamTable({ date }: PanchangamProps) {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [panchangamData, setPanchangamData] = useState<PanchangamData>({});
  const [sunTime, setSunTime] = useState<SunTime>({});
  const [moonTime, setMoonTime] = useState<MoonTime>({});

  const { t } = useTranslation();
  const { lat, lng, city, country } = useLocation();
  const panchangamDate = date ? new Date(date) : new Date();

  const getUrlDate = (offset: number) => format(addDays(panchangamDate, offset), 'yyyy-MM-dd');
  const getLabelDate = (offset: number) => format(addDays(panchangamDate, offset), 'MMM d');

  useEffect(() => {
    try {
      const panchang = new YexaaPanchang();

      const calendar = panchang.calendar(panchangamDate, lat, lng);
      const calculated = panchang.calculate(panchangamDate);
      const sun = panchang.sunTimer(panchangamDate, lat, lng);
      const moonDate = new Date(panchangamDate);
      const moonCoords = ITRFCoord.fromGeodeticDeg(lat, lng, 0);
      const moon = moonRiseSet(moonDate, moonCoords);

      setPanchangamData({
        tithi: calculated.Tithi?.name_en_IN || '',
        tithiTime: startEndDateFormat(calculated.Tithi.start, calculated.Tithi.end),
        nakshatra: calculated.Nakshatra?.name_en_IN || '',
        nakshatraTime: startEndDateFormat(calculated.Nakshatra.start, calculated.Nakshatra.end),
        yoga: calculated.Yoga?.name_en_IN || '',
        yogaTime: startEndDateFormat(calculated.Yoga.start, calculated.Yoga.end),
        karana: calculated.Karna?.name_en_IN || '',
        karanaTime: startEndDateFormat(calculated.Karna.start, calculated.Karna.end),
        moonMasa: calendar.MoonMasa?.name_en_IN || '',
        masa: calendar.Masa?.name_en_IN || '',
        paksha: calculated.Paksha?.name_en_IN || '',
        day: calculated.Day?.name_en_UK || '',
        ayana: calendar?.Ayana.name_en_IN || '',
        ritu: calendar?.DrikRitu.name_en_IN || '',
        teluguYear: calendar?.TeluguYear.name_en_IN || '',
      });

      setSunTime(sun);
      setMoonTime(moon);
    } catch (err) {
      console.error('Error calculating Panchangam:', err);
      setPanchangamData({});
      setSunTime({});
      setMoonTime({});
    }
  }, [lat, lng, date]);

  const renderItem = (
    title: string | undefined,
    key: string | undefined,
    time: string | undefined
  ) => (
    <div className="panchang-date">
      <h4 className="gr-text-6 text-black">{title}</h4>
      <ul className="list-unstyled gr-text-8 border-bottom pb-4">
        <li>
          <span className="fw-bold">{t.panchangam[key]}</span> : <span>{time}</span>
        </li>
      </ul>
    </div>
  );

  return (
    <>
      <div className="panchang-header text-black">
        <div className="d-flex w-100 align-items-center">
          <div className="pn-header-text flex-grow-1 pl-2">
            <div className="panchang-nav py-1">
              <ul className="list-unstyled">
                <li className="nav-prev fw-bold">
                  <Link href={`/panchangam/${getUrlDate(-1)}`}>
                    <i className="fa fa-angle-left" /> {getLabelDate(-1)}
                  </Link>
                </li>
                <li className="nav-prev fw-bold">
                  <Link href={`/panchangam/${format(new Date(), 'yyyy-MM-dd')}`}>Today</Link>
                </li>
                <li className="nav-next fw-bold">
                  <Link href={`/panchangam/${getUrlDate(1)}`}>
                    {getLabelDate(1)} <i className="fa fa-angle-right" />
                  </Link>
                </li>
              </ul>
            </div>
            <div className="panchang-title fw-bold">
              <span className="icon-sprite icon-sprite-balaji"></span>
              <h4 className="text-black">
                {t.panchangam.panchang} {t.panchangam[formatMonth(panchangamDate)]}{' '}
                {formatDay(panchangamDate)}, {panchangamDate.getFullYear()}
              </h4>
            </div>
            <div className="collapse-search">
              <div
                className="collapse-header fw-bold py-1 text-white"
                aria-expanded={openCollapse}
                onClick={() => setOpenCollapse(!openCollapse)}
              >
                {city}, {country} <i className="fa fa-chevron-down"></i>
              </div>
              <Collapse in={openCollapse}>
                <div id="collapse-text">
                  <AutoComplete />
                </div>
              </Collapse>
            </div>
          </div>
        </div>
      </div>

      <div className="panchang-secondary-header px-lg-14 px-md-12 px-sm-2 overflow-hidden px-4">
        <PanchangSlide
          sunrise={formatTimeIST(sunTime.sunRise)}
          sunset={formatTimeIST(sunTime.sunSet)}
          moonrise={formatTimeIST(moonTime.rise)}
          moonset={formatTimeIST(moonTime.set)}
        />
      </div>

      <div className="pricing-card gr-hover-shadow-1 gr-text-color border bg-white px-4 py-2">
        <div className="panchang-date">
          <ul className="list-unstyled gr-text-8 border-bottom pb-3">
            <li>
              <span className="fw-bold">{t.panchangam.date}</span> :{' '}
              <span>
                {t.panchangam[formatMonth(panchangamDate)]} {formatDay(panchangamDate)}
              </span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.week_day}</span> :{' '}
              <span>{t.panchangam[panchangamData.day]}</span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.month}</span> :{' '}
              <span>{t.panchangam[panchangamData.moonMasa]}</span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.lunar_year}</span> :{' '}
              <span>{t.panchangam[panchangamData.teluguYear]}</span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.ruthu}</span> :{' '}
              <span>{t.panchangam[panchangamData.ritu]}</span>
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.ayana}</span> :{' '}
              <span>{t.panchangam[panchangamData.ayana]}</span>
            </li>
          </ul>
        </div>
        {renderItem(t.panchangam.tithi, panchangamData.tithi, panchangamData.tithiTime)}
        {renderItem(t.panchangam.nakshatra, panchangamData.nakshatra, panchangamData.nakshatraTime)}
        {renderItem(t.panchangam.karana, panchangamData.karana, panchangamData.karanaTime)}
        {renderItem(t.panchangam.yoga, panchangamData.yoga, panchangamData.yogaTime)}
        <div className="panchang-date">
          <h4 className="gr-text-6 text-black">{t.panchangam.sun_moon_time}</h4>
          <ul className="list-unstyled gr-text-8">
            <li>
              <span className="fw-bold">{t.panchangam.sunrise}</span> :{' '}
              {formatTimeIST(sunTime.sunRise)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.sunset}</span> :{' '}
              {formatTimeIST(sunTime.sunSet)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.moonrise}</span> :{' '}
              {formatTimeIST(moonTime.rise)}
            </li>
            <li>
              <span className="fw-bold">{t.panchangam.moonset}</span> :{' '}
              {formatTimeIST(moonTime.set)}
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .icon-sprite {
          background-image: url(${imgSprite.src});
          background-repeat: no-repeat;
          width: 56px;
          height: 40px;
          display: inline-block;
        }
      `}</style>
    </>
  );
}
