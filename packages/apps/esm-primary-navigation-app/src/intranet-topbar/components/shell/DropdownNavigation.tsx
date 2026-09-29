"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { RandomLetterSwap } from "../ui/random-letter-swap";
import { WaterGlassModal } from "../ui/WaterGlassModal";

export type NavSubMenuItem = {
  label: string;
  description?: string;
  icon: React.ElementType;
  onClick?: () => void;
  link?: string;
};

export type NavSubMenu = {
  title: string;
  items: NavSubMenuItem[];
};

export type NavItem = {
  id: number;
  label: string;
  subMenus?: NavSubMenu[];
  link?: string;
  onClick?: () => void;
};

type Props = {
  navItems: NavItem[];
};

export function DropdownNavigation({ navItems }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [activeNavItem, setActiveNavItem] = useState<NavItem | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [isHover, setIsHover] = useState<number | null>(null);

  // References
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Free Drag-to-Scroll state with full window tracking
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef({
    startX: 0,
    scrollStartLeft: 0,
  });
  const [hasDraggedFar, setHasDraggedFar] = useState(false);

  // Update dropdown portal position based on trigger button bounding rect
  const updateMenuPosition = useCallback((menuLabel: string, subMenusCount: number = 2) => {
    const btn = buttonRefs.current[menuLabel];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const columnWidth = 150;
    const estimatedMenuWidth = Math.min(window.innerWidth - 32, subMenusCount * columnWidth + 32);
    let targetLeft = rect.left;

    // Boundary check so dropdown doesn't spill off the right edge of viewport
    if (targetLeft + estimatedMenuWidth > window.innerWidth - 16) {
      targetLeft = Math.max(12, window.innerWidth - estimatedMenuWidth - 16);
    }

    setMenuCoords({
      top: rect.bottom + 4,
      left: Math.max(12, targetLeft),
    });
  }, []);

  // Free mouse wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollWidth > el.clientWidth) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        el.scrollLeft += delta;
        if (openMenu) updateMenuPosition(openMenu, activeNavItem?.subMenus?.length || 2);
      }
    }
  };

  // Free Drag-to-scroll handlers (souris & main)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    setIsDragging(true);
    setHasDraggedFar(false);
    dragInfoRef.current = {
      startX: e.clientX,
      scrollStartLeft: el.scrollLeft,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const deltaX = e.clientX - dragInfoRef.current.startX;
      if (Math.abs(deltaX) > 4) {
        setHasDraggedFar(true);
        if (openMenu) {
          setOpenMenu(null);
          setActiveNavItem(null);
        }
      }

      el.scrollLeft = dragInfoRef.current.scrollStartLeft - deltaX;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setTimeout(() => {
        setHasDraggedFar(false);
      }, 60);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, openMenu]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (openMenu) {
        updateMenuPosition(openMenu, activeNavItem?.subMenus?.length || 2);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [openMenu, activeNavItem, updateMenuPosition]);

  // Hover & Open handlers with graceful debounce
  const handleItemMouseEnter = (navItem: NavItem) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsHover(navItem.id);
    if (navItem.subMenus && navItem.subMenus.length > 0) {
      setOpenMenu(navItem.label);
      setActiveNavItem(navItem);
      updateMenuPosition(navItem.label, navItem.subMenus.length);
    } else {
      setOpenMenu(null);
      setActiveNavItem(null);
    }
  };

  const handleItemMouseLeave = () => {
    setIsHover(null);
    closeTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
      setActiveNavItem(null);
    }, 180);
  };

  const handleMenuMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
      setActiveNavItem(null);
    }, 180);
  };

  // Outside click listener to dismiss dropdown
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (!openMenu) return;
      const target = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;

      const activeBtn = openMenu ? buttonRefs.current[openMenu] : null;
      if (activeBtn && activeBtn.contains(target)) return;

      setOpenMenu(null);
      setActiveNavItem(null);
    };

    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [openMenu]);

  return (
    <div className="relative w-full max-w-full flex items-center justify-start overflow-hidden select-none">
      {/* Conteneur défilable et glissable */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        className={`w-full flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5 touch-pan-x ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <motion.ul layout className="relative flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          <AnimatePresence mode="popLayout">
            {navItems.map((navItem) => {
              const isItemHovered = isHover === navItem.id || openMenu === navItem.label;
              const hasSubMenus = Boolean(navItem.subMenus && navItem.subMenus.length > 0);

              return (
                <motion.li
                  key={`${navItem.id}-${navItem.label}`}
                  layout
                  initial={{ opacity: 0, y: -3, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 3, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative shrink-0"
                  onMouseEnter={() => handleItemMouseEnter(navItem)}
                  onMouseLeave={handleItemMouseLeave}
                >
                  <button
                    ref={(el) => {
                      buttonRefs.current[navItem.label] = el;
                    }}
                    type="button"
                    className="text-xs sm:text-sm py-1 sm:py-1.5 px-2.5 sm:px-3 flex cursor-pointer group transition-colors duration-200 items-center justify-center gap-1.5 text-slate-200 hover:text-white relative font-medium select-none rounded-lg whitespace-nowrap shrink-0"
                    onClick={(e) => {
                      if (hasDraggedFar) {
                        e.preventDefault();
                        return;
                      }
                      if (hasSubMenus) {
                        if (openMenu === navItem.label) {
                          setOpenMenu(null);
                          setActiveNavItem(null);
                        } else {
                          setOpenMenu(navItem.label);
                          setActiveNavItem(navItem);
                          updateMenuPosition(navItem.label, navItem.subMenus?.length || 2);
                        }
                      }
                      if (navItem.onClick) navItem.onClick();
                    }}
                  >
                    <RandomLetterSwap
                      label={navItem.label}
                      forceHover={isItemHovered}
                      disableDefaultNavigation={true}
                      className="relative z-10 whitespace-nowrap text-slate-200 group-hover:text-white font-medium text-xs sm:text-sm tracking-tight"
                      staggerDuration={0.02}
                      transition={{ duration: 0.5, type: "spring" }}
                    />
                    {hasSubMenus && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 group-hover:text-white duration-200 transition-transform relative z-10 shrink-0 ${
                          openMenu === navItem.label ? "rotate-180 text-teal-400" : ""
                        }`}
                      />
                    )}
                    {isItemHovered && (
                      <motion.div
                        layoutId="hover-bg-intranet"
                        className="absolute inset-0 size-full bg-white/10 rounded-lg"
                        transition={{ duration: 0.15 }}
                      />
                    )}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </div>

      {/* Floating SubMenu rendered via Portal in pure Glassmorphism, ultra-compact */}
      {typeof document !== "undefined" &&
        activeNavItem &&
        activeNavItem.subMenus &&
        openMenu &&
        menuCoords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
              zIndex: 99999,
            }}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
            className="w-auto"
          >
            {/* Pure Clean Transparent WaterGlassModal Container */}
            <WaterGlassModal
              align="none"
              className="mt-0"
              optionsComponent={
                <div className="flex items-start gap-2.5 sm:gap-3.5 divide-x divide-white/10">
                  {activeNavItem.subMenus.map((sub, idx) => (
                    <div 
                      className={`w-auto min-w-[130px] max-w-[185px] ${idx > 0 ? 'pl-2.5 sm:pl-3.5' : ''}`} 
                      key={sub.title}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300 pb-1 mb-1 border-b border-white/10 flex items-center justify-between">
                        <span className="truncate">{sub.title}</span>
                      </div>
                      <ul className="space-y-0.5">
                        {sub.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <li key={item.label}>
                              <a
                                href={item.link || "#"}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (item.onClick) item.onClick();
                                  setOpenMenu(null);
                                  setActiveNavItem(null);
                                }}
                                className="flex items-center gap-1.5 py-1 px-1.5 rounded-xl hover:bg-white/[0.08] text-white hover:text-teal-200 transition-colors group/subitem cursor-pointer"
                                title={item.description || item.label}
                              >
                                <div className="size-5 rounded-lg flex items-center justify-center bg-teal-400/15 border border-teal-300/30 text-teal-200 shrink-0 group-hover/subitem:bg-teal-400/25 group-hover/subitem:text-teal-100 transition-colors">
                                  <Icon className="h-3 w-3 flex-none" />
                                </div>
                                <span className="text-[11px] font-medium text-white group-hover/subitem:text-teal-100 transition-colors truncate">
                                  {item.label}
                                </span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              }
            />
          </div>,
          document.body
        )}
    </div>
  );
}
