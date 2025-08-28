import React from 'react';

interface LoadingProps {
  text?: string;
  className?: string;
}

export default function Loading({ 
  text,
  className = ''
}: LoadingProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <h3>{text || 'Loading...'}</h3>
        <div className={`loading-progress ${className}`}>
          <div className="progress-bar"></div>
        </div>
      </div>
    </div>
  );
}
