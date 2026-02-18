import React from 'react';

const FeedCard = ({ item }) => {
  const { title, subtitle, status, priority, meta, type } = item;
  
  const priorityClass = `priority-${priority.toLowerCase()}`;
  const statusClass = `status-${status.toLowerCase().replace(' ', '-')}`;
  
  return (
    <div className={`feed-card ${priorityClass}`}>
      <div className="card-title">{title}</div>
      <div className="card-subtitle">{subtitle}</div>
      <div className="card-footer">
        <span className={`status-badge ${statusClass}`}>{status}</span>
        <span>{meta}</span>
      </div>
    </div>
  );
};

export default FeedCard;
