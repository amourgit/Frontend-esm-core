/// <reference types="@testing-library/jest-dom/vitest" />
declare module '*.scss';
declare module '*.png' {
  const src: string;
  export default src;
}
