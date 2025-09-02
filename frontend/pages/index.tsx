'use client';
// pages/index.tsx - Home Page
import Layout from '@/components/Layout/Layout';
import SearchBox from '@/components/Layout/SearchBox';
import PanchangamTable from '@/components/PanchangamTable';
import { useTranslation } from '@/hooks/useTranslation';
import { getHomeMetaData } from '@/utils/seo';
import { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Col, Row } from 'react-bootstrap';

const HomePage: React.FC = () => {
  const { t, locale } = useTranslation();
  const { title, description } = getHomeMetaData(locale);

  return (
    <Layout title={title} description={description}>
      <Row className="mt-25 py-5">
        <Col lg="5" md="12" className="my-5 py-5">
          <div className="right-container shadow-1 bg-white text-black">
            <SearchBox inputWidth={100} selectWidth={100} btnWidth={100} />
          </div>
          <div className="right-container shadow-1 mt-4 bg-white text-black">
            <div className="download-block shadow-1 mb-3 mt-3 bg-white px-5 py-3">
              <p className="download-title gr-text-11 text-color-opacity mb-2">Download Our App</p>
              <div className="download-btns">
                <Link
                  href="https://play.google.com/store/apps/details?id=com.yexaa.ssbhakthi"
                  target="_blank"
                >
                  <Image
                    src="/l6-download-appstore.png"
                    alt="Download from App Store"
                    width={120}
                    height={40}
                    className="me-3"
                  />
                </Link>
                <Link
                  href="https://play.google.com/store/apps/details?id=com.yexaa.ssbhakthi"
                  target="_blank"
                >
                  <Image
                    src="/l6-download-gplay.png"
                    alt="Download from Google Play"
                    width={120}
                    height={40}
                  />
                </Link>
              </div>
            </div>
          </div>
        </Col>
        <Col lg="7" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 panchangam-block bg-white">
            <PanchangamTable />
          </div>
        </Col>
      </Row>
    </Layout>
  );
};

export default HomePage;

// For static generation
export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {},
  };
};
