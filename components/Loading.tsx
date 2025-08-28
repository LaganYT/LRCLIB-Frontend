import React from 'react';

interface LoadingProps {
  type?: 'spinner' | 'dots' | 'skeleton' | 'overlay' | 'progress' | 'shimmer';
  size?: 'small' | 'medium' | 'large';
  text?: string;
  showProgress?: boolean;
  className?: string;
}

export default function Loading({ 
  type = 'spinner', 
  size = 'medium', 
  text,
  showProgress = false,
  className = ''
}: LoadingProps) {
  const renderSpinner = () => (
    <div className={`loading-spinner ${size} ${className}`} />
  );

  const renderDots = () => (
    <div className={`loading-dots ${className}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`loading-skeleton ${className}`} style={{ height: '20px' }} />
  );

  const renderProgress = () => (
    <div className={`loading-progress ${className}`}>
      <div className="progress-bar"></div>
    </div>
  );

  const renderShimmer = () => (
    <div className={`loading-shimmer ${className}`} style={{ height: '20px' }} />
  );

  const renderOverlay = () => (
    <div className="loading-overlay">
      <div className="loading-content">
        <h3>{text || 'Loading...'}</h3>
        <div className="loading-spinner large" />
        {showProgress && renderProgress()}
      </div>
    </div>
  );

  switch (type) {
    case 'dots':
      return renderDots();
    case 'skeleton':
      return renderSkeleton();
    case 'overlay':
      return renderOverlay();
    case 'progress':
      return renderProgress();
    case 'shimmer':
      return renderShimmer();
    case 'spinner':
    default:
      return renderSpinner();
  }
}
