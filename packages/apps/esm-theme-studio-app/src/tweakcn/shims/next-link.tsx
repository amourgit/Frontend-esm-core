import * as React from 'react';
import { navigate } from '@egen-civitas/esm-framework';

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

/** Remplace `next/link` : liens externes natifs, liens internes via le routeur du shell EGEN. */
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, prefetch: _p, replace: _r, scroll: _s, onClick, target, ...rest },
  ref,
) {
  const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || target === '_blank';
  return (
    <a
      ref={ref}
      href={href}
      target={target}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || external || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate({ to: href });
      }}
    />
  );
});

export default Link;
