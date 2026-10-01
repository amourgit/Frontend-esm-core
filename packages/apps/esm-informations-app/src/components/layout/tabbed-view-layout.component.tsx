import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/animated-tabs.component';
import { cn } from '../../lib/cn';

export interface TabOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  path?: string;
  disabled?: boolean;
}

export interface TabbedViewLayoutProps<T extends string = string> {
  /** Active selected tab ID */
  activeTab: T;
  /** Callback fired when a tab is selected */
  onTabChange: (value: T, tabOption?: TabOption<T>) => void;
  /** List of tabs to render in the sidebar */
  tabs: TabOption<T>[];
  /** Header content inside sidebar (e.g. back button, search) */
  sidebarHeader?: React.ReactNode;
  /** Footer content inside sidebar */
  sidebarFooter?: React.ReactNode;
  /** Header banner or title inside the right main content area */
  mainHeader?: React.ReactNode;
  /** Custom class for outer page wrapper */
  containerClassName?: string;
  /** Custom class for sidebar `<aside>` */
  sidebarClassName?: string;
  /** Custom class for main content `<main>` */
  mainClassName?: string;
  /** Custom class for `<TabsList>` */
  tabsListClassName?: string;
  /** Custom class for `<TabsTrigger>` buttons */
  tabTriggerClassName?: string;
  /** Render prop or map of content per tab `{ [tabId]: ReactNode }` OR children with `<TabsContent>` */
  contents?: Record<T, React.ReactNode> | ((tabId: T) => React.ReactNode);
  children?: React.ReactNode;
}

export function TabbedViewLayout<T extends string = string>({
  activeTab,
  onTabChange,
  tabs,
  sidebarHeader,
  sidebarFooter,
  mainHeader,
  containerClassName,
  sidebarClassName,
  mainClassName,
  tabsListClassName,
  tabTriggerClassName,
  contents,
  children,
}: TabbedViewLayoutProps<T>) {
  const [isVertical, setIsVertical] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={cn(
        'w-full h-[calc(100dvh-var(--egen-navbar-height,0px)-1.5rem)] my-2 sm:my-3 text-slate-100 overflow-hidden px-3 sm:px-6 lg:px-8 flex flex-col',
        containerClassName,
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          const found = tabs.find((t) => t.id === val);
          onTabChange(val as T, found);
        }}
        orientation={isVertical ? 'vertical' : 'horizontal'}
        className="max-w-7xl w-full mx-auto h-full flex-1 min-h-0 flex flex-col md:flex-row items-stretch gap-4 md:gap-8 overflow-hidden"
      >
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={cn(
            'w-full md:w-[20%] shrink-0 min-w-0 max-w-full flex flex-col justify-start md:justify-center space-y-2 md:space-y-4 sticky top-0 z-10 bg-transparent',
            sidebarClassName,
          )}
        >
          {sidebarHeader}

          <TabsList
            className={cn(
              'w-full bg-transparent border-0 p-0 shadow-none flex md:flex-col items-center md:items-stretch gap-2 overflow-x-auto touch-pan-x scroll-smooth no-scrollbar select-none py-1',
              tabsListClassName,
            )}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={tab.disabled}
                className={cn(
                  'shrink-0 flex-none text-left justify-start px-3.5 py-2 text-xs sm:text-sm md:text-base font-medium bg-transparent border-0 shadow-none hover:bg-transparent cursor-pointer transition-all whitespace-nowrap flex items-center gap-2',
                  tabTriggerClassName,
                )}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && <span className="ml-auto shrink-0">{tab.badge}</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          {sidebarFooter}
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main
          className={cn(
            'w-full md:w-[80%] h-full flex-1 min-h-0 flex flex-col overflow-y-auto bg-transparent p-0 scrollbar-thin scrollbar-thumb-teal-500/20',
            mainClassName,
          )}
        >
          {mainHeader}

          <div className="flex-1 min-h-0 flex flex-col">
            {contents
              ? typeof contents === 'function'
                ? tabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="flex-1 min-h-0 flex flex-col">
                      {contents(tab.id)}
                    </TabsContent>
                  ))
                : tabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="flex-1 min-h-0 flex flex-col">
                      {contents[tab.id]}
                    </TabsContent>
                  ))
              : children}
          </div>
        </main>
      </Tabs>
    </div>
  );
}
