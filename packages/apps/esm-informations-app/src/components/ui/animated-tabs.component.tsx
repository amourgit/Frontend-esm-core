import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import * as React from 'react';

import { cn } from '../../utils/cn';

const componentThemeClassName =
  '[--ic-background:#ffffff] [--ic-foreground:#111111] [--ic-primary:#111111] [--ic-secondary:#646b75] [--ic-surface-border:#e9edf2] [--ic-border:#e3e7ec] [--ic-card:#ffffff] [--ic-card-foreground:#111111] [--ic-muted:#f5f7fa] [--ic-muted-foreground:#6d7480] [--ic-accent:#f3f5f8] [--color-accent:var(--ic-accent)] [--color-accent-foreground:var(--ic-accent-foreground)] [--ic-accent-foreground:#111111] [--ic-input:#e3e7ec] [--ic-ring:rgba(17,17,17,0.16)] [--ic-destructive:#dc2626] [--ic-paper:#fcfcfd] [--ic-popover-foreground:#111111] [--ic-brand:#0ea5e9] [--ic-brand-soft:#bae6fd] [--ic-shadow-soft:0_18px_38px_-24px_rgba(15,23,42,0.35)] [--ic-chart-1:oklch(0.52_0.19_254)] [--ic-chart-2:oklch(0.74_0.11_232)] [--ic-chart-3:oklch(0.42_0.16_262)] [--ic-chart-4:oklch(0.84_0.07_228)] [--ic-chart-5:oklch(0.62_0.14_240)] [--color-background:var(--ic-background)] [--color-foreground:var(--ic-foreground)] [--color-primary:var(--ic-primary)] [--color-secondary:var(--ic-secondary)] [--color-border:var(--ic-border)] [--color-card:var(--ic-card)] [--color-card-foreground:var(--ic-card-foreground)] [--color-muted:var(--ic-muted)] [--color-muted-foreground:var(--ic-muted-foreground)] [--color-accent:var(--ic-accent)] [--color-accent-foreground:var(--ic-accent-foreground)] [--color-input:var(--ic-input)] [--color-ring:var(--ic-ring)] [--color-destructive:var(--ic-destructive)] [--color-paper:var(--ic-paper)] [--color-popover-foreground:var(--ic-popover-foreground)] [--color-brand:var(--ic-brand)] [--color-brand-soft:var(--ic-brand-soft)] [--color-chart-1:var(--ic-chart-1)] [--color-chart-2:var(--ic-chart-2)] [--color-chart-3:var(--ic-chart-3)] [--color-chart-4:var(--ic-chart-4)] [--color-chart-5:var(--ic-chart-5)] dark:[--ic-background:#111111] dark:[--ic-foreground:#f6f3ec] dark:[--ic-primary:#f6f3ec] dark:[--ic-secondary:#cbc6bb] dark:[--ic-surface-border:#2a2a25] dark:[--ic-border:#2b2a25] dark:[--ic-card:#111111] dark:[--ic-card-foreground:#f6f3ec] dark:[--ic-muted:#171716] dark:[--ic-muted-foreground:#9a958a] dark:[--ic-accent:#1a1a18] [--color-accent:var(--ic-accent)] [--color-accent-foreground:var(--ic-accent-foreground)] dark:[--ic-accent-foreground:#f6f3ec] dark:[--ic-input:#2b2a25] dark:[--ic-ring:rgba(246,243,236,0.18)] dark:[--ic-destructive:#f87171] dark:[--ic-paper:#171716] dark:[--ic-popover-foreground:#f6f3ec] dark:[--ic-brand:#38bdf8] dark:[--ic-brand-soft:#0c4a6e] dark:[--ic-shadow-soft:0_20px_44px_-28px_rgba(0,0,0,0.6)] dark:[--ic-chart-1:oklch(0.68_0.17_250)] dark:[--ic-chart-2:oklch(0.82_0.09_225)] dark:[--ic-chart-3:oklch(0.58_0.15_260)] dark:[--ic-chart-4:oklch(0.75_0.12_235)] dark:[--ic-chart-5:oklch(0.88_0.06_220)]';

type TabsContextValue = {
  activationMode: 'automatic' | 'manual';
  baseId: string;
  hoveredValue: string | null;
  listRef: React.MutableRefObject<HTMLDivElement | null>;
  setHoveredValue: (value: string | null) => void;
  triggerRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  value: string | undefined;
  orientation?: 'horizontal' | 'vertical';
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Tabs.`);
  }

  return context;
}

function setRefValue<T>(ref: React.ForwardedRef<T> | undefined, value: T | null) {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function getTriggerId(baseId: string, value: string) {
  return `${baseId}-trigger-${value}`;
}

function getContentId(baseId: string, value: string) {
  return `${baseId}-content-${value}`;
}

function useControllableState<T>({
  defaultProp,
  onChange,
  prop,
}: {
  defaultProp: T;
  onChange?: (value: T) => void;
  prop?: T;
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: T) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [value, setValue] as const;
}

function useMeasure<T extends HTMLElement = HTMLElement>(): [
  (node: T | null) => void,
  { width: number; height: number },
] {
  const [element, setElement] = React.useState<T | null>(null);
  const [bounds, setBounds] = React.useState({ width: 0, height: 0 });

  const ref = React.useCallback((node: T | null) => {
    setElement(node);
  }, []);

  React.useEffect(() => {
    if (!(element && typeof ResizeObserver !== 'undefined')) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setBounds((current) => {
        const next = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        };

        if (current.width === next.width && current.height === next.height) {
          return current;
        }

        return next;
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [ref, bounds];
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

type TabsContentElement = React.ReactElement<TabsContentProps> & {
  ref?: React.Ref<HTMLDivElement>;
};

function isTabsContentElement(node: React.ReactNode): node is React.ReactElement<TabsContentProps> {
  if (!React.isValidElement(node)) {
    return false;
  }

  const displayName = typeof node.type === 'string' ? node.type : (node.type as { displayName?: string }).displayName;

  return displayName === 'TabsContent';
}

function collectTabsContentElements(node: React.ReactNode): TabsContentElement[] {
  const elements: TabsContentElement[] = [];

  const visit = (childNode: React.ReactNode) => {
    React.Children.forEach(childNode, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      if (isTabsContentElement(child)) {
        elements.push(child as TabsContentElement);
        return;
      }

      const element = child as React.ReactElement<{
        children?: React.ReactNode;
      }>;

      if (element.props.children) {
        visit(element.props.children);
      }
    });
  };

  visit(node);
  return elements;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  activationMode?: 'automatic' | 'manual';
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  activationMode = 'manual',
  children,
  className,
  defaultValue,
  onValueChange,
  value: valueProp,
  orientation = 'horizontal',
  ...props
}: TabsProps) {
  const [value, setValue] = useControllableState<string | undefined>({
    defaultProp: defaultValue,
    onChange: (nextValue) => {
      if (nextValue !== undefined) {
        onValueChange?.(nextValue);
      }
    },
    prop: valueProp,
  });
  const [hoveredValue, setHoveredValue] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const baseId = React.useId();

  const contextValue = React.useMemo(
    () => ({
      activationMode,
      baseId,
      hoveredValue,
      listRef,
      setHoveredValue,
      triggerRefs,
      value: valueProp ?? value,
      orientation,
    }),
    [activationMode, baseId, hoveredValue, valueProp, value, orientation],
  );

  return (
    <TabsPrimitive.Root
      activationMode={activationMode}
      onValueChange={setValue}
      value={valueProp ?? value}
      orientation={orientation}
      className={cn('w-full flex-1 min-h-0 h-full flex flex-col', className)}
    >
      <TabsContext.Provider value={contextValue}>
        <div className={cn('w-full flex-1 min-h-0 h-full flex flex-col', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    </TabsPrimitive.Root>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, ...props }, ref) => {
    const { listRef, setHoveredValue, triggerRefs, value, orientation } = useTabsContext('TabsList');
    const [activeRect, setActiveRect] = React.useState({ left: 0, top: 0, width: 0, height: 0 });
    const getTriggerElement = React.useCallback(
      (tabValue: string | null) => {
        if (!tabValue) {
          return null;
        }

        return triggerRefs.current[tabValue] ?? null;
      },
      [triggerRefs],
    );

    const measure = React.useCallback(
      (tabValue: string | null) => {
        if (!tabValue) {
          return null;
        }

        const element = getTriggerElement(tabValue);
        const container = listRef.current;

        if (!(element && container)) {
          return null;
        }

        return {
          left: element.offsetLeft,
          top: element.offsetTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
        };
      },
      [getTriggerElement, listRef],
    );

    React.useLayoutEffect(() => {
      const rect = measure(value ?? null);
      if (rect) {
        setActiveRect(rect);
      }
    }, [measure, value]);

    React.useLayoutEffect(() => {
      const updateRects = () => {
        setActiveRect((current) => {
          const next = measure(value ?? null) ?? { left: 0, top: 0, width: 0, height: 0 };

          if (
            current.left === next.left &&
            current.width === next.width &&
            current.top === next.top &&
            current.height === next.height
          ) {
            return current;
          }

          return next;
        });
      };

      updateRects();

      const container = listRef.current;
      const activeTrigger = getTriggerElement(value ?? null);

      window.addEventListener('resize', updateRects);

      if (typeof ResizeObserver === 'undefined') {
        return () => window.removeEventListener('resize', updateRects);
      }

      const observer = new ResizeObserver(updateRects);

      if (container) {
        observer.observe(container);
      }

      if (activeTrigger) {
        observer.observe(activeTrigger);
      }

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateRects);
      };
    }, [getTriggerElement, listRef, measure, value]);

    const isVertical = orientation === 'vertical';

    const isDraggingRef = React.useRef(false);
    const startXRef = React.useRef(0);
    const scrollLeftRef = React.useRef(0);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseDown?.(e);
      if (e.defaultPrevented) return;
      const container = listRef.current;
      if (!container) return;
      isDraggingRef.current = true;
      startXRef.current = e.pageX - container.offsetLeft;
      scrollLeftRef.current = container.scrollLeft;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseMove?.(e);
      if (!isDraggingRef.current) return;
      const container = listRef.current;
      if (!container) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      container.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseUp?.(e);
      isDraggingRef.current = false;
    };

    return (
      <TabsPrimitive.List
        {...props}
        className={cn(
          'no-scrollbar relative isolate inline-flex max-w-full items-center overflow-x-auto overscroll-x-contain whitespace-nowrap bg-transparent p-0 border-0 shadow-none touch-pan-x cursor-grab active:cursor-grabbing',
          isVertical ? 'flex-col items-stretch cursor-default active:cursor-default' : '',
          className,
        )}
        loop
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          isDraggingRef.current = false;

          if (!event.defaultPrevented) {
            setHoveredValue(null);
          }
        }}
        ref={(node) => {
          listRef.current = node;
          setRefValue(ref, node);
        }}
      >
        {children}
        <motion.div
          key={isVertical ? 'vertical-indicator' : 'horizontal-indicator'}
          animate={
            isVertical
              ? { top: activeRect.top, height: activeRect.height, left: 0, width: 4 }
              : { left: activeRect.left, width: activeRect.width, bottom: 0, height: 3 }
          }
          aria-hidden
          className={cn('pointer-events-none absolute z-10 bg-teal-400', isVertical ? 'rounded-r' : 'rounded-full')}
          style={{
            backgroundColor: 'var(--color-teal-400, #2dd4bf)',
          }}
          transition={{
            damping: 34,
            mass: 0.7,
            stiffness: 360,
            type: 'spring',
          }}
        />
      </TabsPrimitive.List>
    );
  },
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export const TabsTrigger = React.forwardRef<HTMLElement, TabsTriggerProps>(
  ({ children, className, onBlur, onFocus, onMouseEnter, style, value, ...props }, ref) => {
    const {
      baseId,
      hoveredValue,
      listRef,
      setHoveredValue,
      triggerRefs,
      value: activeValue,
    } = useTabsContext('TabsTrigger');
    const isActive = activeValue === value;
    const isHover = hoveredValue === value;

    React.useEffect(() => {
      if (isActive && triggerRefs.current[value]) {
        triggerRefs.current[value]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, [isActive, value, triggerRefs]);

    return (
      <TabsPrimitive.Trigger
        {...props}
        aria-controls={getContentId(baseId, value)}
        className={cn(
          'relative inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset transition-colors cursor-pointer select-none',
          className,
        )}
        data-state={isActive ? 'active' : 'inactive'}
        data-value={value}
        id={getTriggerId(baseId, value)}
        onBlur={(event) => {
          onBlur?.(event);

          if (!(event.defaultPrevented || listRef.current?.contains(event.relatedTarget as Node | null))) {
            setHoveredValue(null);
          }
        }}
        onFocus={(event) => {
          onFocus?.(event);

          if (!event.defaultPrevented) {
            setHoveredValue(value);
          }
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);

          if (!event.defaultPrevented) {
            setHoveredValue(value);
          }
        }}
        ref={(node) => {
          triggerRefs.current[value] = node;
          setRefValue(ref, node);
        }}
        style={{
          ...style,
          color: isActive ? '#5eead4' : isHover ? '#f8fafc' : '#94a3b8',
        }}
        value={value}
      >
        <span className="relative z-10">{children}</span>
      </TabsPrimitive.Trigger>
    );
  },
);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ children, className, value, ...props }, ref) => {
    const { value: activeValue, baseId } = useTabsContext('TabsContent');
    const isActive = activeValue === value;
    const hasMountedRef = React.useRef(false);

    React.useEffect(() => {
      hasMountedRef.current = true;
    }, []);

    if (!isActive) return null;

    return (
      <TabsPrimitive.Content
        {...props}
        forceMount
        id={getContentId(baseId, value)}
        ref={ref}
        value={value}
        className={cn('w-full flex-1 min-h-0 outline-none', className)}
      >
        <motion.div
          animate={{
            filter: 'blur(0px)',
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          className="w-full flex-1 flex flex-col"
          initial={
            hasMountedRef.current
              ? {
                  filter: 'blur(7px)',
                  opacity: 0.72,
                  scale: 0.988,
                  y: 8,
                }
              : false
          }
          key={value}
          style={{ willChange: 'filter, opacity, transform' }}
          transition={{
            damping: 24,
            mass: 0.85,
            stiffness: 220,
            type: 'spring',
            filter: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.18, ease: 'easeOut' },
          }}
        >
          {children}
        </motion.div>
      </TabsPrimitive.Content>
    );
  },
);
TabsContent.displayName = 'TabsContent';

export { Tabs as tabs };

export default Tabs;
