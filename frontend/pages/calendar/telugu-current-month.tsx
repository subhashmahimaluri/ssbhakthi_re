import Layout from '@/components/Layout/Layout';
import TeluguCalendarWithFestivals from '@/components/TeluguCalendarWithFestivals';
import { useTranslation } from '@/hooks/useTranslation';
import Head from 'next/head';

export default function TeluguCalendarPage() {
  const { t, locale } = useTranslation();

  const pageTitle =
    locale === 'te'
      ? 'తెలుగు పంచాంగ క్యాలెండర్ - పండుగలు మరియు వ్రతాలు'
      : 'Telugu Panchangam Calendar - Festivals & Vratams';

  const pageDescription =
    locale === 'te'
      ? 'తెలుగు పంచాంగం ప్రకారం ప్రస్తుత నెల పండుగలు, వ్రతాలు, తిథులు మరియు నక్షత్రాలతో కూడిన క్యాలెండర్'
      : 'Telugu Panchangam calendar for current month with festivals, vratams, tithis and nakshatras';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={
            locale === 'te'
              ? 'తెలుగు పంచాంగం, పండుగలు, వ్రతాలు, తిథి, నక్షత్రం, క్యాలెండర్'
              : 'Telugu Panchangam, Telugu Calendar, Festivals, Vratams, Tithi, Nakshatra'
          }
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/calendar/telugu-current-month" />
      </Head>

      <Layout>
        <div className="telugu-calendar-page">
          <TeluguCalendarWithFestivals />
        </div>

        <style jsx>{`
          .telugu-calendar-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }

          :global(.telugu-calendar-with-festivals) {
            margin-top: 0;
            padding-top: 2rem;
          }

          :global(.calendar-grid) {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e9ecef;
          }

          :global(.day-details) {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid #e9ecef;
          }

          :global(.calendar-nav) {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          :global(.calendar-nav .text-primary) {
            color: white !important;
          }

          :global(.calendar-nav .text-muted) {
            color: rgba(255, 255, 255, 0.8) !important;
          }

          :global(.nav-btn),
          :global(.today-btn) {
            border-color: rgba(255, 255, 255, 0.3);
            color: white;
          }

          :global(.nav-btn:hover),
          :global(.today-btn:hover) {
            background-color: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
          }

          :global(.today-btn) {
            background-color: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
          }

          /* Enhanced event cards */
          :global(.event-card) {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 8px !important;
            transition: all 0.3s ease;
          }

          :global(.event-card:hover) {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
          }

          :global(.event-card.border-warning) {
            border-left: 4px solid #ffc107 !important;
            border-top: 1px solid #ffeaa7 !important;
          }

          :global(.event-card.border-success) {
            border-left: 4px solid #28a745 !important;
            border-top: 1px solid #55efc4 !important;
          }

          /* Enhanced calendar cells */
          :global(.has-festival) {
            background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
          }

          :global(.has-vrath) {
            background: linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%);
          }

          :global(.has-festival.has-vrath) {
            background: linear-gradient(135deg, #fff8e1 0%, #f1f8e9 50%, #ffffff 100%);
          }

          /* Responsive improvements */
          @media (max-width: 768px) {
            :global(.calendar-nav) {
              flex-direction: column;
              gap: 1rem;
              text-align: center;
            }

            :global(.nav-buttons) {
              justify-content: center;
            }

            :global(.telugu-calendar-with-festivals .mt-25) {
              margin-top: 1rem !important;
            }

            :global(.telugu-calendar-with-festivals .py-5) {
              padding-top: 1rem !important;
              padding-bottom: 1rem !important;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
