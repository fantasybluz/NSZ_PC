// 橫向捲動的卡片列（apple.com/tw/mac 的「探索全系列產品」「了解 Mac」那種）：
// 卡片可以用滑的，右下角有上一頁／下一頁的圓鈕；捲到底的那一邊會變淡。

import React from 'react';

interface ShelfProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const Shelf: React.FC<ShelfProps> = ({ label, children, className = '' }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });

  const update = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      start: track.scrollLeft <= 4,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4,
    });
  }, []);

  React.useEffect(() => {
    update();
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => observer.disconnect();
  }, [update, children]);

  const page = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={`shelf ${className}`}>
      <div className="shelf-track" ref={trackRef} onScroll={update} role="list" aria-label={label}>
        {React.Children.map(children, (child) => (
          <div className="shelf-item" role="listitem">
            {child}
          </div>
        ))}
      </div>
      {edges.start && edges.end ? null : (
        <div className="shelf-controls">
          <button type="button" onClick={() => page(-1)} disabled={edges.start} aria-label="上一頁">
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => page(1)} disabled={edges.end} aria-label="下一頁">
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Shelf;
