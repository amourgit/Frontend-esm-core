import * as React from 'react';

const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect fill="none" />
    <line x1="208" y1="128" x2="207.8" y2="128.2" stroke="currentColor" strokeLinecap="round" strokeWidth="24" />
    <line x1="168.2" y1="167.8" x2="128" y2="208" stroke="currentColor" strokeLinecap="round" strokeWidth="24" />
    <line x1="192" y1="40" x2="115.8" y2="116.2" stroke="currentColor" strokeLinecap="round" strokeWidth="24" />
    <line x1="76.2" y1="155.8" x2="40" y2="192" stroke="currentColor" strokeLinecap="round" strokeWidth="24" />
    <circle cx="188" cy="148" r="24" fill="none" stroke="currentColor" strokeWidth="24" />
    <circle cx="96" cy="136" r="24" fill="none" stroke="currentColor" strokeWidth="24" />
  </svg>
);

export default LogoIcon;
