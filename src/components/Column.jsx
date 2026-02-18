import React from 'react';
import FeedCard from './FeedCard';

const Column = ({ title, subtitle, items }) => {
  return (
    <div className="column">
      <div className="column-header">
        <h2>{title}</h2>
        <div className="subtitle">{subtitle}</div>
      </div>
      <div className="feed-container">
        {items.map((item, index) => (
          <FeedCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Column;
