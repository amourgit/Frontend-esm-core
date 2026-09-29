"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { motion } from "motion/react";
import { cn } from "../../utils/cn";
import { X } from "lucide-react";

function GooeyFilter({ filterId, blur }: { filterId: string; blur: number }) {
  return (
    <svg
      className="pointer-events-none absolute -top-[9999px] -left-[9999px] w-0 h-0 opacity-0 overflow-hidden"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={blur}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          {/* Bordure fine et délicate qui suit la forme liquide et le pont organique */}
          <feMorphology in="goo" operator="dilate" radius="1" result="dilated" />
          <feComposite in="dilated" in2="goo" operator="out" result="borderMask" />
          <feColorMatrix
            in="borderMask"
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0.35 0"
            result="border"
          />
          {/* Surface verre effet eau : 100% transparent, sans noir, reflets cristallins */}
          <feColorMatrix
            in="goo"
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0.13 0"
            result="fill"
          />
          <feMerge>
            <feMergeNode in="fill" />
            <feMergeNode in="border" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId, className }: { layoutId: string; className?: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className={cn("size-3.5 sm:size-4 shrink-0", className)}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: "spring" as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
}

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  expanded?: boolean;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSubmit?: (value: string) => void;
  onClick?: () => void;
  disabled?: boolean;
}

export function GooeyInput({
  placeholder = "Rechercher...",
  className,
  classNames,
  collapsedWidth = 115,
  expandedWidth = 220,
  expandedOffset = 40,
  gooeyBlur = 4,
  value: valueProp,
  defaultValue = "",
  expanded: expandedProp,
  onValueChange,
  onOpenChange,
  onKeyDown,
  onSubmit,
  onClick,
  disabled = false,
}: GooeyInputProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `gooey-filter-${safeId}`;
  const iconLayoutId = `gooey-input-icon-${safeId}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      setIsSmallScreen(w < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isControlledExpanded = expandedProp !== undefined;
  const isExpanded = isControlledExpanded ? expandedProp : internalExpanded;

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      if (!isControlledExpanded) {
        setInternalExpanded(next);
      }
      onOpenChange?.(next);
    },
    [isControlledExpanded, onOpenChange],
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current) {
      setSearchText("");
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, setSearchText]);

  const isMobileOrTablet = windowWidth < 1024;
  const effectiveCollapsedWidth = isSmallScreen ? 34 : collapsedWidth;
  const effectiveExpandedWidth = isSmallScreen
    ? Math.max(120, Math.min(195, windowWidth - 110))
    : isMobileOrTablet
    ? Math.min(300, windowWidth - 140)
    : expandedWidth;
  const effectiveOffset = isSmallScreen ? 34 : expandedOffset;

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: effectiveCollapsedWidth, marginLeft: 0 },
      expanded: { width: effectiveExpandedWidth, marginLeft: effectiveOffset },
    }),
    [effectiveCollapsedWidth, effectiveExpandedWidth, effectiveOffset],
  );

  const handleExpand = useCallback(() => {
    if (!disabled) {
      setExpanded(true);
      onClick?.();
    }
  }, [disabled, setExpanded, onClick]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText],
  );

  const handleBlur = useCallback(() => {
    if (!searchText) setExpanded(false);
  }, [searchText, setExpanded]);

  const handleKeyDownInternal = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSubmit?.(searchText);
      } else if (e.key === "Escape") {
        setExpanded(false);
      }
      onKeyDown?.(e);
    },
    [onSubmit, searchText, setExpanded, onKeyDown],
  );

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none overflow-visible",
        className,
        classNames?.root,
      )}
    >
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      {/* COUCHE 1 : Formes liquides organiques Gooey filtrées (verre transparent effet eau) */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none flex items-center overflow-visible",
          classNames?.filterWrap,
        )}
        style={{ filter: `url(#${filterId})` }}
      >
        {/* Bulle liquide qui se détache */}
        <motion.div
          className={cn(
            "absolute top-1/2 left-0 -translate-y-1/2 rounded-full",
            classNames?.bubble,
          )}
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            className={cn(
              "size-8 sm:size-8.5 rounded-full bg-white",
              classNames?.bubbleSurface,
            )}
          />
        </motion.div>

        {/* Capsule liquide principale */}
        <motion.div
          className={cn("h-8 sm:h-8.5 rounded-full", classNames?.buttonRow)}
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div className="h-full w-full rounded-full bg-white" />
        </motion.div>
      </div>

      {/* COUCHE 2 : Contenu interactif net (icônes, texte, saisie) sans distorsion */}
      <div className="relative flex h-8 sm:h-8.5 items-center overflow-visible">
        {/* Bouton de la bulle détachée quand étendu */}
        <motion.div
          className={cn(
            "absolute top-1/2 left-0 -translate-y-1/2 flex size-8 sm:size-8.5 items-center justify-center cursor-pointer z-10",
            classNames?.bubble,
          )}
          variants={iconBubbleVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
          onClick={() => {
            if (searchText.trim()) {
              onSubmit?.(searchText);
            } else {
              inputRef.current?.focus();
            }
          }}
          title="Rechercher"
        >
          <SearchIcon layoutId={iconLayoutId} className="text-teal-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
        </motion.div>

        {/* Capsule interactive pour la saisie */}
        <motion.div
          className={cn(
            "flex h-8 sm:h-8.5 items-center justify-center overflow-hidden rounded-full",
            classNames?.buttonRow,
          )}
          variants={buttonVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={transition}
        >
          <div
            onClick={handleExpand}
            className={cn(
              "flex h-full w-full cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium outline-none",
              classNames?.trigger,
            )}
          >
            {!isExpanded && (
              <SearchIcon
                layoutId={iconLayoutId}
                className="text-teal-400 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              />
            )}

            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={searchText}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDownInternal}
              disabled={disabled || !isExpanded}
              placeholder={placeholder}
              className={cn(
                "h-full min-w-0 flex-1 bg-transparent text-xs text-white placeholder-slate-300/80 outline-none font-normal",
                isExpanded
                  ? "cursor-text"
                  : "pointer-events-none select-none cursor-pointer",
                isSmallScreen && !isExpanded ? "hidden" : "block",
                classNames?.input,
              )}
            />

            {isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (searchText) {
                    setSearchText("");
                    inputRef.current?.focus();
                  } else {
                    setExpanded(false);
                  }
                }}
                className="p-0.5 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-white/10"
                title={searchText ? "Effacer" : "Fermer la recherche"}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default GooeyInput;
