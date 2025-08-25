'use client';

import Layout from '@/components/Layout/Layout';
import { stotraToHtml } from '@/utils/utils';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

type Stotra = {
  title: string;
  url: string;
  content: string;
};

export default function StotraPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [stotra, setStotra] = useState<Stotra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();
    const locale = router.locale || 'te';

    fetch(`/data/${locale}/stotras.json`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const found = data.posts?.find((p: Stotra) => p.url === slug);
        setStotra(found || null);
        setLoading(false);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort();
  }, [slug, router.locale]);

  if (loading) return <div>Loading...</div>;
  if (!stotra) {
    router.push('/404');
    return null;
  }

  return (
    <Layout>
      <Row className="mt-25 py-5">
        <Col xl="8" lg="8" md="12" className="my-5 py-5">
          <div className="left-container shadow-1 px-md-10 bg-white px-5 py-5 text-black">
            <h1 className="mb-4 text-center text-2xl font-bold">{stotra.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: stotraToHtml(stotra.content) }} />
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
