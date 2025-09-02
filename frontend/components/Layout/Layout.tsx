// components/Layout/Layout.tsx
import Head from 'next/head';
import React from 'react';
import { Container } from 'react-bootstrap';
import Footer from './Footer';
import Header from './Header/Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, description }) => {
  return (
    <>
      <Head>
        <title>{title || 'SS Bhakthi - Hindu Devotional Information'}</title>
        <meta
          name="description"
          content={
            description ||
            'SS Bhakthi is hindu devotional information including Panchangam, Calendar, Stotras, Bhakthi Articles, Festivals Dates, Muhurthas and Temple guide'
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="d-flex flex-column min-vh-100">
        <Header />

        <main className="flex-grow-1">
          <Container>{children}</Container>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Layout;
