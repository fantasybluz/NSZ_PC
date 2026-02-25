import React from 'react';
import { carouselImages } from '../data/siteData';

const slides = carouselImages.slice(0, 10);

const CarouselSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const currentSlide = slides[activeIndex];

  const shiftSlide = (delta: number) => {
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) {
        return slides.length - 1;
      }
      if (next >= slides.length) {
        return 0;
      }
      return next;
    });
  };

  return (
    <section className="section-card carousel-showcase reveal">
      <div className="section-head">
        <p className="section-kicker">Recent Builds</p>
        <h2 className="section-title">實拍組裝案例</h2>
        <p className="section-sub">每台主機都會先完成壓測與線材整理，再進行包裝出貨。</p>
      </div>

      <div className="carousel-main">
        <img className="carousel-image" src={currentSlide} alt={`nszpc-build-${activeIndex + 1}`} />
        <div className="carousel-overlay">
          <span>Build #{activeIndex + 1}</span>
          <strong>線材、風道、噪音平衡一次到位</strong>
        </div>

        <div className="carousel-controls">
          <button type="button" onClick={() => shiftSlide(-1)} aria-label="上一張">
            <i className="fa-solid fa-arrow-left" />
          </button>
          <button type="button" onClick={() => shiftSlide(1)} aria-label="下一張">
            <i className="fa-solid fa-arrow-right" />
          </button>
        </div>
      </div>

      <div className="thumb-row" role="tablist" aria-label="案例縮圖">
        {slides.map((image, idx) => (
          <button
            key={image}
            type="button"
            className={`thumb-button ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => setActiveIndex(idx)}
            aria-label={`切換到第 ${idx + 1} 張`}
          >
            <img src={image} alt={`縮圖 ${idx + 1}`} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default CarouselSection;
