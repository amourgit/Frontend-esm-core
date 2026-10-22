import React from 'react';

/** Fond SVG dégradé animé (flottement lent), piloté par les tokens du thème EGEN (voir `.login-root`). */
export const GradientBackground: React.FC = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 800 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    className="absolute left-0 top-0 h-full w-full"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="login_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--login-grad-1a)', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: 'var(--login-grad-1b)', stopOpacity: 0.6 }} />
      </linearGradient>
      <linearGradient id="login_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--login-grad-2a)', stopOpacity: 0.9 }} />
        <stop offset="50%" style={{ stopColor: 'var(--login-grad-2b)', stopOpacity: 0.7 }} />
        <stop offset="100%" style={{ stopColor: 'var(--login-grad-2c)', stopOpacity: 0.6 }} />
      </linearGradient>
      <radialGradient id="login_grad3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: 'var(--login-grad-3a)', stopOpacity: 0.8 }} />
        <stop offset="100%" style={{ stopColor: 'var(--login-grad-3b)', stopOpacity: 0.4 }} />
      </radialGradient>
      <filter id="login_blur1" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="35" />
      </filter>
      <filter id="login_blur2" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="25" />
      </filter>
      <filter id="login_blur3" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="45" />
      </filter>
    </defs>
    <g className="login-float-1" style={{ animation: 'login-float-1 20s ease-in-out infinite' }}>
      <ellipse
        cx="200"
        cy="500"
        rx="250"
        ry="180"
        fill="url(#login_grad1)"
        filter="url(#login_blur1)"
        transform="rotate(-30 200 500)"
      />
      <rect
        x="500"
        y="100"
        width="300"
        height="250"
        rx="80"
        fill="url(#login_grad2)"
        filter="url(#login_blur2)"
        transform="rotate(15 650 225)"
      />
    </g>
    <g className="login-float-2" style={{ animation: 'login-float-2 25s ease-in-out infinite' }}>
      <circle cx="650" cy="450" r="150" fill="url(#login_grad3)" filter="url(#login_blur3)" opacity="0.7" />
      <ellipse
        cx="50"
        cy="150"
        rx="180"
        ry="120"
        fill="var(--login-grad-accent)"
        filter="url(#login_blur2)"
        opacity="0.8"
      />
    </g>
  </svg>
);
