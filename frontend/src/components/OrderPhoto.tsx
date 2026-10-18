import React from 'react';

interface OrderPhotoProps {
  /** 照片網址；沒有照片給空字串或不給 */
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * 出機紀錄的照片。沒有照片（或照片讀不到）時顯示淺灰底＋主機圖示的空白格，
 * 不拿別台主機的照片充數。樣式在 styles/apple-site.css 的 .photo-placeholder。
 */
const OrderPhoto: React.FC<OrderPhotoProps> = ({ src, alt, className = '', loading = 'lazy' }) => {
  const [failedSrc, setFailedSrc] = React.useState('');

  if (!src || failedSrc === src) {
    return (
      <span className={`photo-placeholder ${className}`.trim()} aria-hidden="true">
        <i className="fa-solid fa-desktop" />
      </span>
    );
  }

  return <img src={src} alt={alt} className={className || undefined} loading={loading} onError={() => setFailedSrc(src)} />;
};

export default OrderPhoto;
