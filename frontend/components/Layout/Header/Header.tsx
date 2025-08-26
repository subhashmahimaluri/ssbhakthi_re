'use client';

import { device } from '@/utils/breakpoints';
import { useScrollPosition } from '@n8tb1t/use-scroll-position';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Container } from 'react-bootstrap';
import styled from 'styled-components';
import { menuItems } from './navItems';
import SearchBarHeader from './SearchBarHeader';
import TopBar from './TopBar';

type NavItem = {
  name: string;
  href: string;
  isExternal?: boolean;
  items?: NavItem[];
};

const SiteHeader = styled.header`
  padding: 10px 0 10px 0;
  position: absolute !important;
  top: 0;
  right: 0;
  width: 100%;
  z-index: 999;
  background: #fe7102;
  box-shadow: 0 12px 34px -11px rgb(65 62 101 / 10%);
  @media ${device.lg} {
    position: fixed !important;
    transition: 0.6s;
    &.scrolling {
      transform: translateY(-100%);
      transition: 0.6s;
    }
    &.reveal-header {
      transform: translateY(0%);
      box-shadow: 0 12px 34px -11px rgba(65, 62, 101, 0.1);
      z-index: 9999;
      background: rgb(252, 253, 254);
    }
  }
`;

export default function Header() {
  const pathname = usePathname();
  const [display, setDisplay] = useState(false);
  const [showScrolling, setShowScrolling] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const hideSearch = !display ? 'hide-div' : '';
  const hideNav = display ? 'hide-div' : '';

  useScrollPosition(({ prevPos, currPos }) => {
    if (currPos.y < 0) {
      setShowScrolling(true);
    } else {
      setShowScrolling(false);
    }
    if (currPos.y < -300) {
      setShowReveal(true);
    } else {
      setShowReveal(false);
    }
  });

  return (
    <SiteHeader
      className={`site-header site-header--absolute sticky-header site-header--menu-center py-0 ${showScrolling ? 'scrolling' : ''} ${showReveal ? 'reveal-header' : ''} `}
    >
      {!showReveal ? (
        <Container>
          <TopBar />
        </Container>
      ) : (
        ''
      )}
      <div className="navbar site-navbar offcanvas-active navbar-expand-lg py-sm-6 py-lg-2 px-0">
        {/* Logo */}
        <Container>
          <div className="brand-logo">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" width="170" height="61" alt="SS Bhakthi" />
            </Link>
          </div>

          {/* Menu */}
          <div className="navbar-collapse collapse">
            <div className="navbar-nav-wrapper">
              <ul className={`navbar-nav main-menu d-none d-lg-flex fa-pull-left ${hideNav}`}>
                {menuItems.map((item: NavItem, index: number) => {
                  const hasSubItems = Array.isArray(item.items);

                  return (
                    <li
                      className={`nav-item ${hasSubItems ? 'dropdown' : ''}`}
                      key={item.name + index}
                    >
                      {hasSubItems ? (
                        <>
                          <a
                            className="nav-link dropdown-toggle gr-toggle-arrow"
                            href="#"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            onClick={e => e.preventDefault()}
                          >
                            {item.name}
                            <i className="fa-solid fa-angle-down"></i>
                          </a>
                          <ul className="gr-menu-dropdown dropdown-menu">
                            {Array.isArray(item.items) &&
                              item.items.map((subItem: NavItem, subIndex: number) => (
                                <li className="dropdown-item" key={subItem.name + subIndex}>
                                  {subItem.isExternal ? (
                                    <a
                                      href={subItem.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="dropdown-link"
                                    >
                                      {subItem.name}
                                    </a>
                                  ) : (
                                    <Link href={subItem.href} className="dropdown-link">
                                      {subItem.name}
                                    </Link>
                                  )}
                                </li>
                              ))}
                          </ul>
                        </>
                      ) : item.isExternal ? (
                        <a
                          className="nav-link"
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link href={item.href} className="nav-link">
                          {item.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              {/* Search Bar */}
              <div className={`header-search fa-pull-left me-md-6 mx-2 my-2 ${hideSearch}`}>
                <SearchBarHeader mobile={false} />
              </div>

              {/* Search Button */}
              <div className="search-btn fa-pull-right fa-border-left-primary my-4 mr-20 pb-1 ps-6 pt-1 text-white">
                <i
                  className="gr-text-8 text-primary fa fa-search show-curser"
                  onClick={() => setDisplay(!display)}
                ></i>
              </div>
            </div>{' '}
          </div>
        </Container>
      </div>
    </SiteHeader>
  );
}
