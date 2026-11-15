import * as React from 'react';

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
};

/** Remplace `next/image` : une simple balise <img>. */
export default function Image({
  fill,
  priority: _a,
  quality: _b,
  placeholder: _c,
  blurDataURL: _d,
  unoptimized: _e,
  loader: _f,
  style,
  alt,
  ...rest
}: ImageProps) {
  return (
    <img
      alt={alt ?? ''}
      style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
      {...rest}
    />
  );
}
