'use client';
import { withRef } from '../../lib/with-ref';

import * as React from 'react';
import { Separator as SeparatorPrimitive } from 'radix-ui';

import { cn } from '../../lib/utils';

function SeparatorImpl({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)}
      {...props}
    />
  );
}

export { Separator };

const Separator = withRef(SeparatorImpl);
