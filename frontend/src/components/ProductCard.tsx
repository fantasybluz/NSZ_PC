import React from 'react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  name: string;
  image: string;
  description: string;
  price: number;
  dealDate?: string;
  detailPath: string;
  badge?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  image,
  description,
  price,
  dealDate,
  detailPath,
  badge,
}) => (
  <article className="product-card">
    <Link to={detailPath} className="product-image-link" aria-label={`查看 ${name} 詳細介紹`}>
      <div className="product-image-wrap">
        {badge ? <span className="product-badge">{badge}</span> : null}
        <img src={image} alt={name} className="product-image" loading="lazy" />
      </div>
    </Link>

    <div className="product-body">
      <h3>{name}</h3>
      <p>{description}</p>

      <div className="product-bottom">
        <div className="product-price-block">
          <strong>NT$ {price.toLocaleString('zh-TW')}</strong>
          <span className="product-deal-date">成交日期：{dealDate || '未標示'}</span>
        </div>
        <Link to={detailPath} className="inline-btn">
          查看細節
        </Link>
      </div>
    </div>
  </article>
);

export default ProductCard;
