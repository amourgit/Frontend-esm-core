/// <reference types="@testing-library/jest-dom/vitest" />
declare module '*.module.css';
declare module '*.png' {
  const src: string;
  export default src;
}
