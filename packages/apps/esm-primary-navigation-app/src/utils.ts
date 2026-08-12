import type { LayoutType } from '@egen-civitas/esm-framework';

export const isDesktop = (layout: LayoutType) => layout === 'small-desktop' || layout === 'large-desktop';
