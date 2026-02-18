import React from 'react';
import Column from './Column';

const Dashboard = ({ columns }) => {
  return (
    <div className="dashboard">
      {columns.map((col, index) => (
        <Column 
          key={index}
          title={col.title}
          subtitle={col.subtitle}
          items={col.items}
        />
      ))}
    </div>
  );
};

export default Dashboard;
