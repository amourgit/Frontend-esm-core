import type { LayoutType } from '@egen/esm-framework';

export const isDesktop = (layout: LayoutType) => layout === 'small-desktop' || layout === 'large-desktop';
