import { withRef } from '../../lib/with-ref';
import { cn } from '../../lib/utils';

function SkeletonImpl({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-accent', className)} {...props} />;
}

export { Skeleton };

const Skeleton = withRef(SkeletonImpl);
