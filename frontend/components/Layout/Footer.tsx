import Image from 'next/image';
import Script from 'next/script';
import { Col, Container, Row } from 'react-bootstrap';

import Link from 'next/link';
import SocialIcons from './SocialIcons';

const Footer = () => {
  const contactClassName = 'gr-text-color';
  const linkClassName = 'gr-text-color gr-hover-text-orange';
  const iconClassName = 'gr-text-color';
  const copyClassName = 'gr-text-color-opacity';

  return (
    <>
      <div className={`footer-section bg-blackish-blue dark-mode-texts`}>
        <Container>
          <div className="footer-top pt-lg-5 pb-lg-3 pt-5">
            <Row>
              {/* Editor Picks */}
              <Col xs="6" lg="3">
                <div className="single-footer mb-lg-3 mb-3">
                  <h4 className="footer-title gr-text-16 text-color-opacity text-primary mb-7">
                    Editor Pics
                  </h4>
                  <ul className="footer-list list-unstyled">
                    <li className="py-2">
                      <Link
                        href="/stotras/sri-ayyappa-sharanu-gosha"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Ayyappa Sharanugosha
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/stotras/sri-varahi-dwadasa-nama-stotram"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Varahi Dwadashanama Stotram
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/sahasranamavali/sri-vishnu-sahasranamavali"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Vishnu Sahasranamavali
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/stotras/ayyappa-paddhenimidhi-metla-paata-onnam-thiruppadi"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Ayyappa Paddenimidi Metla Pata (Onnam Thiruppadi)
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/stotras/sri-ayyappa-suprabhatham"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Ayyappa Suprabhatham
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/stotras/sri-kiratha-ashtakam"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Kiratha Ashtakam
                      </Link>
                    </li>
                  </ul>
                </div>
              </Col>

              {/* Popular Posts */}
              <Col xs="6" lg="3">
                <div className="single-footer mb-lg-3 mb-3">
                  <h4 className="footer-title gr-text-16 text-primary mb-7">Popular Posts</h4>
                  <ul className="footer-list list-unstyled">
                    <li className="py-2">
                      <Link
                        href="/ashtothram/sri-satyanarayana-ashtottara-shatanamavali"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Sathyanarayana Ashtottara Shatanamavali
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/ashtothram/sri-lakshmi-ashtottara-shatanamavali"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Padmavathi Ashtottara Shatanamavali
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/ashtothram/sri-lakshmi-ashtottara-shatanamavali"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Lakshmi Ashtottara Shatanamavali
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="/ashtothram/sri-manasa-devi-ashtottara-shatanaamaavali"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Sri Manasa Devi Ashtottara Shatanamavali
                      </Link>
                    </li>
                  </ul>
                </div>
              </Col>

              {/* Partner Links */}
              <Col xs="6" lg="3">
                <div className="single-footer mb-lg-3 mb-3">
                  <h4 className="footer-title gr-text-16 text-color-opacity text-primary mb-7">
                    Partner Links
                  </h4>
                  <ul className="footer-list list-unstyled">
                    <li className="py-2">
                      <Link
                        href="https://www.yexaa.com/job-support"
                        target="_blank"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Job Support
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="https://www.tunetm.com/courses/business-analysis-courses/business-analyst-training"
                        target="_blank"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Business Analyst Online Training
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="https://www.tunetm.com/job-support/java-job-support"
                        target="_blank"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Java Job Support
                      </Link>
                    </li>
                    <li className="py-2">
                      <Link
                        href="https://www.ssjobsupport.com/"
                        target="_blank"
                        className={`gr-text-10 ${linkClassName}`}
                      >
                        Job Support from India
                      </Link>
                    </li>
                  </ul>
                </div>
              </Col>

              {/* Contact + Apps */}
              <Col xs="6" lg="3">
                <div className="single-footer mb-lg-3 mb-3">
                  <h4 className="footer-title gr-text-16 text-color-opacity text-primary mb-7">
                    Contact us
                  </h4>
                  <ul className="footer-list list-unstyled">
                    <li className="py-2">
                      <a
                        className={`gr-text-10 fw-bold hover-underline active ${contactClassName}`}
                        href="mailto:support@grayic.com"
                      >
                        contact@ssbhakthi.com
                      </a>
                    </li>
                  </ul>
                  <div className="download-block">
                    <p className="download-title gr-text-12 mb-6 text-white">Download Our App</p>
                    <div className="download-btns">
                      <Link
                        href="https://play.google.com/store/apps/details?id=com.yexaa.ssbhakthi"
                        target="_blank"
                      >
                        <Image
                          src="/l6-download-appstore.png"
                          alt="App Store"
                          className="w-xs-auto mb-3 mt-3"
                          width={184}
                          height={58}
                        />
                      </Link>
                      <Link
                        href="https://play.google.com/store/apps/details?id=com.yexaa.ssbhakthi"
                        target="_blank"
                      >
                        <Image
                          src="/l6-download-gplay.png"
                          alt="Google Play"
                          className="w-xs-auto"
                          width={184}
                          height={50}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <div className="copyright-area border-top py-3">
            <Row className="align-items-center">
              <Col lg="6">
                <p
                  className={`copyright-text gr-text-11 mb-lg-0 text-lg-start mb-6 text-center ${copyClassName}`}
                >
                  © 2025 Copyright, All Right Reserved, Made by{' '}
                  <a href="https://www.yexaa.com">Yexaa</a>
                  <i className={`icon icon-heart-2-2 text-primary ms-2 align-middle`} />
                </p>
              </Col>
              <Col lg="6" className="text-lg-end text-center">
                <SocialIcons />
              </Col>
            </Row>
          </div>
        </Container>
      </div>

      {process.env.NODE_ENV !== 'development' && (
        <>
          <Script
            strategy="lazyOnload"
            src="https://www.googletagmanager.com/gtag/js?id=G-36LB3LM4DK"
          />
          <Script id="ga-analytics">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-36LB3LM4DK');
            `}
          </Script>
        </>
      )}
    </>
  );
};

export default Footer;
