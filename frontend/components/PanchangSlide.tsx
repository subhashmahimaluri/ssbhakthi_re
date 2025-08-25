'use client';

import React, { useRef } from 'react';
import styled from 'styled-components';
import Slider from 'react-slick';
import imgSprite from '../assets/images/icons/panchangam_sprite.png';
import { useTranslation } from '@/hooks/useTranslation';

interface PanchangSlideProps {
  sunrise: string | undefined;
  sunset: string | undefined;
  moonrise: string | undefined;
  moonset: string | undefined;
}

const SliderStyled = styled(Slider)`
  .slick-slide div {
    &:focus {
      outline: none !important;
    }
  }
`;

const PanchangSlide: React.FC<PanchangSlideProps> = ({ sunrise, sunset, moonrise, moonset }) => {
  const elSlider = useRef<Slider>(null);

  const { t } = useTranslation();

  const slickSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    arrows: false,
    className: 'single-slide',
    responsive: [
      {
        breakpoint: 2400,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3,
        },
      },
    ],
  };

  return (
    <>
      <SliderStyled ref={elSlider} {...slickSettings}>
        <div className="list-item-outer py-2">
          <div className="d-flex w-100 align-items-center">
            <span className="icon-sprite icon-sprite-sunrise"></span>
            <div className="flex-grow-1 ps-3">
              <span className="d-block t-sm gr-text-11">{t.panchangam.sunrise}</span>
              <span className="d-block b">{sunrise}</span>
            </div>
          </div>
        </div>
        <div className="list-item-outer py-2">
          <div className="d-flex w-100 align-items-center">
            <span className="icon-sprite icon-sprite-sunset"></span>
            <div className="flex-grow-1 ps-3">
              <span className="d-block t-sm gr-text-11">{t.panchangam.sunset}</span>
              <span className="d-block b">{sunset}</span>
            </div>
          </div>
        </div>
        <div className="list-item-outer py-2">
          <div className="d-flex w-100 align-items-center">
            <span className="icon-sprite icon-sprite-moonrise"></span>
            <div className="flex-grow-1 ps-3">
              <span className="d-block t-sm gr-text-11">{t.panchangam.moonrise}</span>
              <span className="d-block b">{moonrise}</span>
            </div>
          </div>
        </div>
        <div className="list-item-outer py-2">
          <div className="d-flex w-100 align-items-center">
            <span className="icon-sprite icon-sprite-moonset"></span>
            <div className="flex-grow-1 ps-3">
              <span className="d-block t-sm gr-text-11">{t.panchangam.moonset}</span>
              <span className="d-block b">{moonset}</span>
            </div>
          </div>
        </div>
      </SliderStyled>

      <div
        className="list-style-nav-btn list-style-nav-btn-prev"
        onClick={() => elSlider.current?.slickPrev()}
      >
        <i className="icon fa fa-angle-left text-white"></i>
      </div>
      <div
        className="list-style-nav-btn list-style-nav-btn-next"
        onClick={() => elSlider.current?.slickNext()}
      >
        <i className="icon fa fa-angle-right text-white"></i>
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
};

export default PanchangSlide;
