import React from 'react';
import './DualLoader.css';

export default function DualLoader({ overlay = false }) {
  const content = (
    <div className="dual-loader-container">
      <div className="spinner">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}></div>
        ))}
      </div>

    </div>
  );

  if (overlay) {
    return <div className="dual-loader-overlay">{content}</div>;
  }
  return content;
}
